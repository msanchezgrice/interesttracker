import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  // Use test user until Clerk is configured
  const userId = "local-test";

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const events = await prisma.event.findMany({ where: { userId, tsStart: { gte: since } } });
  const manual = await prisma.manualTrend.findMany({ where: { userId } });
  
  console.log('Idea generation:', { userId, eventsCount: events.length, manualTrendsCount: manual.length, since });

  const topicOf = (title: string, url: string) => {
    const t = (title || "").toLowerCase() + " " + (url || "").toLowerCase();
    if (t.includes("agent")) return "agents";
    if (t.includes("rag")) return "RAG";
    if (t.includes("multimodal")) return "multimodal";
    return "general AI";
  };

  const byTopic = new Map<string, { ms: number; urls: Set<string> }>();
  for (const e of events) {
    const topic = topicOf(e.title ?? "", e.url);
    const acc = byTopic.get(topic) ?? { ms: 0, urls: new Set() };
    acc.ms += e.ms;
    acc.urls.add(e.url);
    byTopic.set(topic, acc);
  }

  function normalize(all: number[], v: number) {
    const max = Math.max(1, ...all);
    return Math.min(1, v / max);
  }

  const values = Array.from(byTopic.entries()).map(([topic, v]) => {
    const I = normalize(Array.from(byTopic.values()).map((x) => x.ms), v.ms);
    const m = manual.find((m) => m.topic.toLowerCase() === topic.toLowerCase());
    const T = m ? m.weight : 0.2;
    const N = 1.0;
    const diversityBoost = v.urls.size >= 3 ? 0.05 : 0;
    const total = 0.5 * T + 0.4 * I + 0.1 * N + diversityBoost;
    return { topic, score: { total, interest: I, trend: T, novelty: N, diversityBoost }, urls: Array.from(v.urls).slice(0, 5) };
  });

  const top = values.sort((a, b) => b.score.total - a.score.total).slice(0, 5);
  for (const item of top) {
    await prisma.idea.create({
      data: {
        userId,
        topic: item.topic,
        sourceUrls: item.urls,
        score: item.score.total,
        scoreBreakdown: item.score as object,
      },
    });
  }

  return NextResponse.json({ created: top.length, ideas: top });
}


