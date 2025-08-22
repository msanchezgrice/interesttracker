import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateInterestScore, extractTopicFromEvent } from "@/lib/scoring";

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
          tags: [topicData.topic.toLowerCase().replace(/\s+/g, '-'), 'auto-generated']
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