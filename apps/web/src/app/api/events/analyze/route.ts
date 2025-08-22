import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractPageMetadata } from "@/lib/scraper";
import { calculateInterestScore, extractTopicFromEvent } from "@/lib/scoring";

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
    
    // Skip if already analyzed
    if (event.metadataFetched && event.interestScore !== null) {
      return NextResponse.json({ 
        message: "Already analyzed",
        event 
      });
    }
    
    // Extract metadata
    const metadata = await extractPageMetadata(event.url);
    
    // Calculate interest score
    const interestScore = await calculateInterestScore(event);
    
    // Extract basic themes (will be enhanced with LLM later)
    const topic = extractTopicFromEvent(event);
    const themes = [topic];
    
    // Extract content tags from metadata
    const contentTags = extractContentTags(metadata, event);
    
    // Generate potential ideas (simplified for now)
    const potentialIdeas = generatePotentialIdeas(event, themes, interestScore);
    
    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        metadataFetched: true,
        metadata: metadata as object,
        themes,
        contentTags,
        interestScore,
        potentialIdeas: potentialIdeas as object
      }
    });
    
    return NextResponse.json({ 
      message: "Analysis complete",
      event: updatedEvent 
    });
  } catch (error) {
    console.error("Failed to analyze event:", error);
    return NextResponse.json(
      { error: "Failed to analyze event" },
      { status: 500 }
    );
  }
}

function extractContentTags(metadata: Record<string, unknown>, event: { domain: string; title?: string | null }): string[] {
  const tags = new Set<string>();
  
  // From metadata keywords
  const keywords = metadata.keywords as string[] | undefined;
  if (keywords?.length) {
    keywords.forEach((k: string) => tags.add(k.toLowerCase()));
  }
  
  // From domain
  if (event.domain.includes('github.com')) tags.add('code');
  if (event.domain.includes('youtube.com')) tags.add('video');
  if (event.domain.includes('substack.com')) tags.add('newsletter');
  if (event.domain.includes('news.ycombinator.com')) tags.add('news');
  
  // From title/content analysis (basic for now)
  const description = metadata.description as string | undefined;
  const text = `${event.title || ''} ${description || ''}`.toLowerCase();
  
  if (text.includes('tutorial')) tags.add('tutorial');
  if (text.includes('guide')) tags.add('guide');
  if (text.includes('analysis')) tags.add('analysis');
  if (text.includes('announcement')) tags.add('announcement');
  if (text.includes('research')) tags.add('research');
  
  // Tech-specific tags
  if (text.match(/\b(ai|artificial intelligence|ml|machine learning)\b/)) tags.add('ai');
  if (text.match(/\b(react|vue|angular|frontend)\b/)) tags.add('frontend');
  if (text.match(/\b(node|python|backend|api)\b/)) tags.add('backend');
  if (text.match(/\b(startup|founder|entrepreneur)\b/)) tags.add('startup');
  
  return Array.from(tags).slice(0, 10); // Limit to 10 tags
}

interface PotentialIdea {
  title: string;
  hook: string;
  format: string;
}

function generatePotentialIdeas(event: { ms: number; domain: string; scroll?: number | null; title?: string | null }, themes: string[], interestScore: number): PotentialIdea[] {
  // Simple idea generation (will be enhanced with LLM)
  const ideas = [];
  
  if (interestScore > 70) {
    ideas.push({
      title: `Deep dive into ${themes[0]}`,
      hook: `Here's what I learned spending ${Math.round(event.ms / 60000)} minutes on ${event.domain}`,
      format: 'thread'
    });
  }
  
  if (event.scroll && event.scroll > 0.8) {
    ideas.push({
      title: `Key takeaways from "${event.title || 'this article'}"`,
      hook: `Found this gem that changed how I think about ${themes[0]}`,
      format: 'tweet'
    });
  }
  
  if (themes.includes('Open Source')) {
    ideas.push({
      title: `Exploring new tools in ${themes[0]}`,
      hook: `Just discovered an interesting project that solves...`,
      format: 'blog'
    });
  }
  
  return ideas;
}
