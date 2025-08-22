import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateInterestScore, extractTopicFromEvent } from "@/lib/scoring";
import { generateContentIdeas } from "@/lib/llm/ideas";
import { analyzePageThemes } from "@/lib/llm/themes";

export async function POST() {
  try {
    // Get user - hardcoded for now
    const userId = "local-test";
    
    // Get recent high-engagement events
    const recentEvents = await prisma.event.findMany({
      where: {
        userId,
        tsStart: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Last 48 hours
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
      let contentIdeas = [];
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
            sessionLength: bestEvent.ms / 1000,
            scrollPercentage: bestEvent.scroll,
            interestScore: bestEvent.interestScore || topicData.avgEngagement
          },
          themes: {
            themes: themes.length ? themes : [topicData.topic],
            contentType: 'article',
            technicalLevel: 'intermediate',
            keyInsights: [`High engagement with ${topicData.topic} content`]
          },
          recentTopics: Array.from(topicScores.keys()).slice(0, 5)
        };
        
        contentIdeas = await generateContentIdeas(ideaContext);
      } catch {
        console.log('LLM generation failed, using fallback');
      }
      
      // Pick the best idea or create a fallback
      const bestIdea = contentIdeas[0] || {
        title: `Insights on ${topicData.topic}`,
        format: 'tweet',
        estimatedReach: { score: 70, reasoning: 'Topic shows high engagement' },
        tags: [topicData.topic.toLowerCase().replace(/\s+/g, '-')],
        proposedOutput: {
          platform: 'twitter',
          content: `Just spent time diving into ${topicData.topic}. The key takeaway: [Add your insight here]\n\nWhat's your experience with this?`,
          metadata: { hashtags: [topicData.topic.toLowerCase().replace(/\s+/g, '')] }
        }
      };

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
          tags: bestIdea.tags || [topicData.topic.toLowerCase().replace(/\s+/g, '-'), 'auto-generated'],
          format: bestIdea.format,
          estimatedReach: bestIdea.estimatedReach?.score || 70,
          proposedOutput: bestIdea.proposedOutput || bestIdea.draftContent ? {
            platform: bestIdea.format,
            content: bestIdea.draftContent || bestIdea.proposedOutput?.content || '',
            metadata: {
              hashtags: bestIdea.hashtags || bestIdea.proposedOutput?.metadata?.hashtags || [],
              angle: bestIdea.angle
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