import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = "local-test"; // TODO: Get from auth
    
    const excludedDomains = await prisma.excludedDomain.findMany({
      where: { userId },
      select: { domain: true, createdAt: true }
    });
    
    return NextResponse.json({ excludedDomains });
  } catch (error) {
    console.error("Failed to fetch excluded domains:", error);
    return NextResponse.json({ error: "Failed to fetch excluded domains" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = "local-test"; // TODO: Get from auth
    const { domain } = await req.json();
    
    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }
    
    // Create or update excluded domain
    await prisma.excludedDomain.upsert({
      where: { userId_domain: { userId, domain } },
      update: {},
      create: { userId, domain }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to exclude domain:", error);
    return NextResponse.json({ error: "Failed to exclude domain" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = "local-test"; // TODO: Get from auth
    const { domain } = await req.json();
    
    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }
    
    await prisma.excludedDomain.delete({
      where: { userId_domain: { userId, domain } }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unexclude domain:", error);
    return NextResponse.json({ error: "Failed to unexclude domain" }, { status: 500 });
  }
}
