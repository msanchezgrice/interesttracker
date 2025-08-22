import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractPageMetadata } from "@/lib/scraper";
import { calculateInterestScore } from "@/lib/scoring";
import { analyzePageThemes } from "@/lib/llm/themes";
import { generateContentIdeas, type IdeaGenerationContext } from "@/lib/llm/ideas";

export async function POST(req: NextRequest) {
  try {
    const { eventId } = await req.json();
    
    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }
    
    // Get the event
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // Skip if already analyzed (unless force flag is set)
    const { force } = await req.json().catch(() => ({ force: false }));
    if (!force && event.metadataFetched && event.interestScore !== null) {
      return NextResponse.json({ 
        message: "Already analyzed",
        event 
      });
    }
    
    // Extract metadata
    const metadata = await extractPageMetadata(event.url);
    
    // Calculate interest score
    const interestScore = await calculateInterestScore(event);
    
    // Analyze themes with LLM
    const themeAnalysis = await analyzePageThemes(metadata, event);
    
    // Generate content ideas based on engagement
    const ideaContext: IdeaGenerationContext = {
      event: {
        url: event.url,
        title: event.title,
        domain: event.domain,
        interestScore,
        sessionLength: Math.round(event.ms / 1000),
        scrollPercentage: event.scroll ? Math.round(event.scroll * 100) : 0
      },
      themes: themeAnalysis,
      // TODO: Add user's recent topics and expertise from their history
    };
    
    const contentIdeas = await generateContentIdeas(ideaContext);
    
    // Transform ideas for storage
    const potentialIdeas = contentIdeas.map(idea => ({
      title: idea.title,
      hook: idea.hook,
      format: idea.format,
      estimatedReach: idea.estimatedReach,
      angle: idea.angle,
      outline: idea.outline
    }));
    
    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        metadataFetched: true,
        metadata: metadata as object,
        themes: themeAnalysis.themes,
        contentTags: themeAnalysis.contentTags,
        interestScore,
        potentialIdeas: potentialIdeas as object
      }
    });
    
    return NextResponse.json({ 
      message: "Analysis complete",
      event: updatedEvent,
      analysis: {
        themes: themeAnalysis,
        ideas: contentIdeas
      }
    });
  } catch (error) {
    console.error("Failed to analyze event:", error);
    return NextResponse.json(
      { error: "Failed to analyze event" },
      { status: 500 }
    );
  }
}