import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    // Get auth - for now using hardcoded user
    const userId = "local-test";
    
    // Parse query params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sortBy") || "tsStart";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Fetch enhanced events
    const events = await prisma.event.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        url: true,
        title: true,
        domain: true,
        ms: true,
        scroll: true,
        tsStart: true,
        tsEnd: true,
        metadataFetched: true,
        metadata: true,
        themes: true,
        contentTags: true,
        interestScore: true,
        potentialIdeas: true,
        createdAt: true
      }
    });
    
    // Get total count for pagination
    const totalCount = await prisma.event.count({
      where: { userId }
    });
    
    // Transform events for display
    const enhancedEvents = events.map(event => ({
      ...event,
      sessionLength: Math.round((event.ms || 0) / 1000), // Convert to seconds
      scrollPercentage: event.scroll ? Math.round(event.scroll * 100) : 0,
      // Format dates
      date: event.tsStart.toISOString(),
      formattedDate: new Date(event.tsStart).toLocaleString(),
      // Extract metadata safely
      description: (event.metadata as any)?.description || null,
      image: (event.metadata as any)?.ogImage || null,
      author: (event.metadata as any)?.author || null,
      // Default values for new fields
      themes: event.themes || [],
      contentTags: event.contentTags || [],
      interestScore: event.interestScore || 0,
      potentialIdeas: event.potentialIdeas || []
    }));
    
    return NextResponse.json({
      events: enhancedEvents,
      totalCount,
      hasMore: offset + limit < totalCount
    });
  } catch (error) {
    console.error("Failed to fetch enhanced events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
