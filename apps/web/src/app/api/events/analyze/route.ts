import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractPageMetadata } from "@/lib/scraper";
import { calculateInterestScore } from "@/lib/scoring";
import { analyzePageThemes } from "@/lib/llm/themes";
import { generateContentIdeas, type IdeaGenerationContext } from "@/lib/llm/ideas";

export async function POST(req: NextRequest) {
  console.log('[Analyze API] Received analyze request');
  
  try {
    const { eventId } = await req.json();
    console.log('[Analyze API] Event ID:', eventId);
    
    if (!eventId) {
      console.error('[Analyze API] No event ID provided');
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
      console.log('[Analyze API] Event already analyzed, skipping');
      return NextResponse.json({ 
        message: "Already analyzed",
        event 
      });
    }
    
    // Extract metadata
    console.log('[Analyze API] Extracting metadata...');
    const metadata = await extractPageMetadata(event.url);
    console.log('[Analyze API] Metadata extracted:', {
      hasDescription: !!metadata.description,
      hasKeywords: !!metadata.keywords?.length,
      hasContent: !!metadata.mainContent
    });
    
    // Calculate interest score
    console.log('[Analyze API] Calculating interest score...');
    const interestScore = await calculateInterestScore(event);
    console.log('[Analyze API] Interest score:', interestScore);
    
    // Analyze themes with LLM
    console.log('[Analyze API] Analyzing themes...');
    const themeAnalysis = await analyzePageThemes(metadata, event);
    console.log('[Analyze API] Themes:', themeAnalysis.themes);
    
    // Generate content ideas based on engagement
    console.log('[Analyze API] Generating content ideas...');
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
    console.log('[Analyze API] Ideas generated:', contentIdeas);
    
    // Transform ideas for storage
    const potentialIdeas = contentIdeas.map(idea => ({
      title: idea.title,
      hook: idea.hook,
      format: idea.format,
      estimatedReach: idea.estimatedReach,
      angle: idea.angle,
      outline: idea.outline,
      draftContent: idea.draftContent,
      hashtags: idea.hashtags
    }));
    
    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        metadataFetched: true,
        metadata: metadata as object,
        themes: themeAnalysis?.themes || [],
        contentTags: themeAnalysis?.contentTags || [],
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