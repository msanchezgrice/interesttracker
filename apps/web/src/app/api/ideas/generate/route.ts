import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateInterestScore, extractTopicFromEvent } from "@/lib/scoring";
import { generateContentIdeas } from "@/lib/llm/ideas";
import { analyzePageThemes } from "@/lib/llm/themes";

export async function POST(request: Request) {
  try {
    // Get user - hardcoded for now
    const userId = "local-test";
    
    // Get ignored domains and weekly interests from request body
    const body = await request.json().catch(() => ({}));
    const ignoredDomains = body.ignoredDomains || [];
    const weeklyInterests = body.weeklyInterests || [];
    
    // Get recent high-engagement events, excluding ignored domains
    const recentEvents = await prisma.event.findMany({
      where: {
        userId,
        tsStart: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Last 48 hours
        },
        domain: {
          notIn: ignoredDomains
        }
      },
      orderBy: {
        tsStart: 'desc'
      },
      take: 50
    });

    // Calculate scores if not already done
    const eventsWithScores = await Promise.all(
      recentEvents.map(async (event) => {
        const score = event.interestScore || await calculateInterestScore(event);
        return { ...event, interestScore: score };
      })
    );

    // Group by topic and calculate aggregate scores
    const topicScores = new Map<string, { 
      topic: string; 
      totalScore: number; 
      events: typeof eventsWithScores; 
      avgEngagement: number;
    }>();

    for (const event of eventsWithScores) {
      const topic = extractTopicFromEvent(event);
      const existing = topicScores.get(topic) || {
        topic,
        totalScore: 0,
        events: [],
        avgEngagement: 0
      };
      
      existing.totalScore += event.interestScore;
      existing.events.push(event);
      topicScores.set(topic, existing);
    }

    // Calculate average engagement per topic
    for (const [, data] of topicScores) {
      data.avgEngagement = data.totalScore / data.events.length;
    }

    // Get top topics by score
    const topTopics = Array.from(topicScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);

    // Generate ideas for top topics
    const generatedIdeas = [];
    
    for (const topicData of topTopics) {
      // Use the highest scoring events as sources
      const topEvents = topicData.events
        .sort((a, b) => b.interestScore - a.interestScore)
        .slice(0, 3);

      // Get the best event to base ideas on
      const bestEvent = topEvents[0];
      
      // Generate content ideas using LLM
      let contentIdeas: unknown[] = [];
      try {
        // Get themes if not already analyzed
        let themes = bestEvent.themes || [];
        if (!themes.length && bestEvent.metadata) {
          const themeAnalysis = await analyzePageThemes(bestEvent.metadata as Record<string, unknown>, bestEvent);
          themes = themeAnalysis.themes;
        }
        
        const ideaContext = {
          event: {
            url: bestEvent.url,
            title: bestEvent.title,
            domain: bestEvent.domain,
            sessionLength: bestEvent.ms / 1000,
            scrollPercentage: bestEvent.scroll || 0,
            interestScore: bestEvent.interestScore || topicData.avgEngagement
          },
          themes: {
            themes: themes.length ? themes : [topicData.topic],
            contentTags: bestEvent.contentTags || [],
            contentType: 'analysis' as const,
            technicalLevel: 'intermediate' as const,
            keyInsights: [`High engagement with ${topicData.topic} content`]
          },
          recentTopics: Array.from(topicScores.keys()).slice(0, 5),
          weeklyInterests: weeklyInterests
        };
        
        contentIdeas = await generateContentIdeas(ideaContext);
      } catch {
        console.log('LLM generation failed, using fallback');
      }
      
      // Pick the best idea or create a fallback
      const bestIdea = (contentIdeas[0] as Record<string, unknown>) || {
        title: `Insights on ${topicData.topic}`,
        format: 'TWITTER',
        estimatedReach: { score: 70, reasoning: 'Topic shows high engagement' },
        tags: [topicData.topic.toLowerCase().replace(/\s+/g, '-')],
        proposedOutput: {
          platform: 'twitter',
          content: `Just spent time diving into ${topicData.topic}. The key takeaway: [Add your insight here]\n\nWhat's your experience with this?`,
          metadata: { hashtags: [topicData.topic.toLowerCase().replace(/\s+/g, '')] }
        }
      };
      
      // Map format to uppercase for Prisma enum
      const formatMap: Record<string, 'TWITTER' | 'LINKEDIN' | 'BLOG' | 'SHORTS'> = {
        'tweet': 'TWITTER',
        'twitter': 'TWITTER',
        'thread': 'TWITTER',
        'linkedin': 'LINKEDIN',
        'linkedin post': 'LINKEDIN',
        'blog': 'BLOG',
        'video': 'SHORTS',
        'shorts': 'SHORTS'
      };
      
      const rawFormat = ((bestIdea.format as string) || 'tweet').toLowerCase();
      const prismaFormat = formatMap[rawFormat] || 'TWITTER';

      const idea = await prisma.idea.create({
        data: {
          userId,
          topic: topicData.topic,
          sourceUrls: topEvents.map(e => e.url),
          score: topicData.avgEngagement / 100, // Normalize to 0-1
          scoreBreakdown: {
            interest: topicData.avgEngagement,
            eventCount: topicData.events.length,
            topSources: topEvents.map(e => ({
              url: e.url,
              title: e.title,
              score: e.interestScore
            }))
          },
          sourceEventIds: topEvents.map(e => e.id),
          tags: (bestIdea.tags as string[]) || [topicData.topic.toLowerCase().replace(/\s+/g, '-'), 'auto-generated'],
          format: prismaFormat,
          estimatedReach: (bestIdea.estimatedReach as { score: number })?.score || (bestIdea.estimatedReach as number) || 70,
          proposedOutput: bestIdea.proposedOutput || bestIdea.draftContent ? {
            platform: (bestIdea.format as string) || 'TWITTER',
            content: (bestIdea.draftContent as string) || (bestIdea.proposedOutput as { content?: string })?.content || '',
            metadata: {
              hashtags: (bestIdea.hashtags as string[]) || (bestIdea.proposedOutput as { metadata?: { hashtags?: string[] } })?.metadata?.hashtags || [],
              angle: bestIdea.angle as string
            }
          } : undefined
        }
      });

      generatedIdeas.push(idea);
    }

    // Update manual trends based on actual engagement
    for (const topicData of topTopics) {
      const existingTrend = await prisma.manualTrend.findFirst({
        where: {
          userId,
          topic: topicData.topic
        }
      });

      if (!existingTrend && topicData.avgEngagement > 60) {
        // Create auto-detected trend
        await prisma.manualTrend.create({
          data: {
            userId,
            topic: topicData.topic,
            weight: Math.min(topicData.avgEngagement / 100, 0.9),
            note: `Auto-detected based on ${topicData.events.length} high-engagement visits`,
            decayAfterDays: 14
          }
        });
      }
    }

    return NextResponse.json({
      message: "Ideas generated successfully",
      ideas: generatedIdeas,
      topicsAnalyzed: topTopics.length,
      eventsProcessed: eventsWithScores.length
    });
  } catch (error) {
    console.error("Failed to generate ideas:", error);
    return NextResponse.json(
      { error: "Failed to generate ideas" },
      { status: 500 }
    );
  }
}