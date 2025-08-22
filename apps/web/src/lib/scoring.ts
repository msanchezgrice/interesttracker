import { Event } from '@prisma/client';
import { prisma } from './prisma';

export async function calculateInterestScore(event: Event & { userId: string }): Promise<number> {
  // Base metrics (0-100 scale)
  const timeScore = normalizeTime(event.ms);
  const scrollScore = (event.scroll || 0) * 20; // 0-20 points
  const repeatVisitScore = await getRepeatScore(event.userId, event.domain);
  const recencyScore = getRecencyBoost(event.tsStart);
  const diversityScore = await getDomainDiversity(event.userId);
  
  // Weighted sum
  const score = Math.round(
    timeScore * 0.4 +      // 40% weight on time spent
    scrollScore * 0.2 +    // 20% weight on scroll depth
    repeatVisitScore * 0.2 + // 20% weight on repeat visits
    recencyScore * 0.1 +   // 10% weight on recency
    diversityScore * 0.1   // 10% weight on domain diversity
  );
  
  return Math.min(100, Math.max(0, score));
}

function normalizeTime(ms: number): number {
  // Sigmoid curve: peaks around 3-5 min, plateaus after 10 min
  const minutes = ms / 60000;
  
  if (minutes < 0.5) return 5; // Very short visits get minimal score
  if (minutes > 20) return 40; // Cap at 20 minutes
  
  // Sigmoid function centered at 4 minutes
  return 40 * (1 / (1 + Math.exp(-0.5 * (minutes - 4))));
}

async function getRepeatScore(userId: string, domain: string): Promise<number> {
  // Count visits to this domain in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const visitCount = await prisma.event.count({
    where: {
      userId,
      domain,
      tsStart: { gte: sevenDaysAgo }
    }
  });
  
  // Scale: 1 visit = 0, 2-3 = 10, 4-6 = 15, 7+ = 20
  if (visitCount <= 1) return 0;
  if (visitCount <= 3) return 10;
  if (visitCount <= 6) return 15;
  return 20;
}

function getRecencyBoost(tsStart: Date): number {
  const hoursAgo = (Date.now() - tsStart.getTime()) / (1000 * 60 * 60);
  
  if (hoursAgo < 1) return 10;  // Within last hour
  if (hoursAgo < 6) return 8;   // Within 6 hours
  if (hoursAgo < 24) return 6;  // Within 24 hours
  if (hoursAgo < 48) return 4;  // Within 48 hours
  if (hoursAgo < 168) return 2; // Within a week
  return 0;
}

async function getDomainDiversity(userId: string): Promise<number> {
  // Check how many different domains visited in last 48h
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const uniqueDomains = await prisma.event.findMany({
    where: {
      userId,
      tsStart: { gte: twoDaysAgo }
    },
    select: { domain: true },
    distinct: ['domain']
  });
  
  const count = uniqueDomains.length;
  
  // Scale: 1-2 domains = 0, 3-5 = 5, 6-10 = 8, 11+ = 10
  if (count <= 2) return 0;
  if (count <= 5) return 5;
  if (count <= 10) return 8;
  return 10;
}

// Topic extraction from URL and title
export function extractTopicFromEvent(event: { url: string; title?: string | null; domain: string }): string {
  const combined = `${event.title || ''} ${event.url} ${event.domain}`.toLowerCase();
  
  // Simple keyword-based topic extraction (to be enhanced with LLM)
  const topicKeywords: Record<string, string[]> = {
    'AI Agents': ['agent', 'crew', 'autonomous', 'langchain', 'autogen', 'crewai'],
    'Machine Learning': ['ml', 'model', 'training', 'neural', 'deep learning', 'transformer'],
    'Web Development': ['react', 'nextjs', 'typescript', 'javascript', 'frontend', 'backend'],
    'Product Management': ['product', 'roadmap', 'user research', 'metrics', 'analytics'],
    'Startups': ['startup', 'founder', 'funding', 'yc', 'venture', 'entrepreneur'],
    'Blockchain': ['crypto', 'blockchain', 'defi', 'nft', 'ethereum', 'bitcoin'],
    'DevOps': ['docker', 'kubernetes', 'ci/cd', 'deployment', 'infrastructure'],
    'Data Science': ['data', 'analysis', 'visualization', 'pandas', 'jupyter'],
    'Security': ['security', 'vulnerability', 'encryption', 'authentication', 'privacy'],
    'Cloud': ['aws', 'azure', 'gcp', 'cloud', 'serverless', 'lambda']
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      return topic;
    }
  }
  
  // Default topic based on domain
  if (event.domain.includes('github.com')) return 'Open Source';
  if (event.domain.includes('youtube.com')) return 'Video Content';
  if (event.domain.includes('substack.com')) return 'Newsletter';
  if (event.domain.includes('news.ycombinator.com')) return 'Tech News';
  
  return 'General Tech';
}
