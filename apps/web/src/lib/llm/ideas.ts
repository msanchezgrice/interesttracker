import { getLLM } from './index';
import type { ThemeAnalysis } from './themes';

export interface ContentIdea {
  title: string;
  hook: string;
  format: 'tweet' | 'thread' | 'linkedin' | 'blog' | 'video';
  estimatedReach: {
    score: number;      // 1-100
    reasoning: string;
  };
  angle: string;        // Your unique perspective
  outline?: string[];   // For longer formats
}

export interface IdeaGenerationContext {
  event: {
    url: string;
    title?: string | null;
    domain: string;
    interestScore: number;
    sessionLength: number; // seconds
    scrollPercentage: number;
  };
  themes: ThemeAnalysis;
  recentTopics?: string[];
  userExpertise?: string[];
}

export async function generateContentIdeas(
  context: IdeaGenerationContext
): Promise<ContentIdea[]> {
  const llm = getLLM();
  
  if (!llm) {
    return generateBasicIdeas(context);
  }

  const prompt = `
You are a content strategist helping a builder/founder create engaging content based on their interests.

Context about what captured their attention:
- Page: ${context.event.title || context.event.url}
- Interest Score: ${context.event.interestScore}/100
- Time Spent: ${Math.round(context.event.sessionLength / 60)} minutes
- Engagement: Read ${context.event.scrollPercentage}% of the page
- Main Themes: ${context.themes.themes.join(', ')}
- Content Type: ${context.themes.contentType}
- Key Insights: ${context.themes.keyInsights.join('; ')}

${context.recentTopics?.length ? `Recent interests: ${context.recentTopics.join(', ')}` : ''}
${context.userExpertise?.length ? `Their expertise: ${context.userExpertise.join(', ')}` : ''}

Generate 3-4 content ideas that:
1. Build on what interested them about this content
2. Add their unique perspective as a builder
3. Are specific and actionable (not generic)
4. Match different formats (tweet, thread, LinkedIn post, blog, video)
5. Have strong hooks that would stop scrolling

For each idea provide:
- title: Clear, specific title
- hook: First line that grabs attention
- format: Best format for this idea
- estimatedReach: score (1-100) and reasoning based on topic trends
- angle: Their unique take or perspective
- outline: (for blog/video only) 3-5 main points

Focus on practical, builder-oriented content that provides value.
`;

  try {
    const response = await llm.completeJSON<{ ideas: ContentIdea[] }>(prompt);
    return response.ideas.slice(0, 4);
  } catch (error) {
    console.error('LLM idea generation failed:', error);
    return generateBasicIdeas(context);
  }
}

// Fallback idea generation without LLM
function generateBasicIdeas(context: IdeaGenerationContext): ContentIdea[] {
  const ideas: ContentIdea[] = [];
  const { event, themes } = context;

  // High engagement = thread opportunity
  if (event.interestScore > 70) {
    ideas.push({
      title: `Deep dive into ${themes.themes[0]}`,
      hook: `I spent ${Math.round(event.sessionLength / 60)} minutes diving into ${themes.themes[0]}. Here's what blew my mind:`,
      format: 'thread',
      estimatedReach: {
        score: 75,
        reasoning: 'Deep dives on trending topics perform well'
      },
      angle: 'Personal learning journey with practical takeaways'
    });
  }

  // Tutorial content = how-to post
  if (themes.contentType === 'tutorial') {
    ideas.push({
      title: `How to implement ${themes.themes[0]} (practical guide)`,
      hook: `Just learned an elegant approach to ${themes.themes[0]}. Here's how you can implement it:`,
      format: 'blog',
      estimatedReach: {
        score: 80,
        reasoning: 'Practical tutorials have high search value'
      },
      angle: 'Step-by-step implementation guide',
      outline: [
        'The problem it solves',
        'Core concepts explained simply',
        'Implementation walkthrough',
        'Common pitfalls to avoid',
        'Next steps and resources'
      ]
    });
  }

  // News/announcement = hot take
  if (themes.contentType === 'news' || themes.contentType === 'product') {
    ideas.push({
      title: `Why ${themes.themes[0]} matters for builders`,
      hook: `Everyone's talking about ${event.title?.slice(0, 50) || themes.themes[0]}, but here's what it really means for builders:`,
      format: 'linkedin',
      estimatedReach: {
        score: 70,
        reasoning: 'Timely commentary on news gets engagement'
      },
      angle: 'Builder perspective on industry news'
    });
  }

  // Always include a tweet option
  ideas.push({
    title: `Quick insight on ${themes.themes[0]}`,
    hook: `${themes.keyInsights[0] || `Interesting perspective on ${themes.themes[0]}`} ${event.url}`,
    format: 'tweet',
    estimatedReach: {
      score: 60,
      reasoning: 'Quick insights are shareable'
    },
    angle: 'Concise takeaway with link to source'
  });

  return ideas;
}
