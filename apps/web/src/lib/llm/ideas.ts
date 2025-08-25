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
  draftContent?: string; // The actual draft
  outline?: string[];   // For longer formats
  hashtags?: string[];  // Suggested hashtags
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
  weeklyInterests?: string[];
}

export async function generateContentIdeas(
  context: IdeaGenerationContext
): Promise<ContentIdea[]> {
  console.log('[Idea Generation] Starting content idea generation');
  console.log('[Idea Generation] Context:', {
    url: context.event.url,
    title: context.event.title,
    sessionLength: context.event.sessionLength,
    scrollPercentage: context.event.scrollPercentage,
    interestScore: context.event.interestScore,
    themes: context.themes.themes,
    recentTopics: context.recentTopics
  });
  
  const llm = getLLM();
  
  if (!llm) {
    console.log('[Idea Generation] No LLM available, using fallback generation');
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

User's Background & Current Focus:
${context.recentTopics?.length ? `- Recent browsing interests: ${context.recentTopics.join(', ')}` : ''}
${context.userExpertise?.length ? `- Professional expertise: ${context.userExpertise.join(', ')}` : ''}
${context.weeklyInterests?.length ? `- THIS WEEK'S FOCUS (MUST incorporate): ${context.weeklyInterests.join(', ')}` : ''}

CRITICAL REQUIREMENTS:
Every content idea MUST directly connect to the user's weekly focus areas. The ideas should bridge what they just read with their current priorities.

Generate 3-4 content ideas that:
1. Build on the SPECIFIC content they just consumed (not generic themes)
2. DIRECTLY RELATE to their weekly focus areas - show the connection explicitly
3. Leverage their professional expertise to add unique insights
4. Are specific and actionable (reference actual points from the content)
5. Match different formats (tweet, thread, LinkedIn post, blog, video)
6. Have strong hooks that would stop scrolling

For each idea provide:
- title: Clear, specific title
- hook: First line that grabs attention
- format: Best format for this idea
- estimatedReach: score (1-100) and reasoning based on topic trends
- angle: Their unique take or perspective
- draftContent: The actual draft content (tweet text, thread bullets, LinkedIn post, or blog intro)
- hashtags: 3-5 relevant hashtags (no # symbol)
- outline: (for blog/video only) 3-5 main points

IMPORTANT: For draftContent:
- Tweet: Full 280 character tweet ready to post
- Thread: 3-5 tweet thread with numbered points
- LinkedIn: 150-200 word post with line breaks
- Blog: 200 word intro paragraph
- Video: 60 second script with hook + 3 points

Focus on practical, builder-oriented content that provides value.
`;

  try {
    console.log('[Idea Generation] Sending prompt to LLM...');
    const response = await llm.completeJSON<Record<string, unknown>>(prompt);
    console.log('[Idea Generation] Raw LLM response:', JSON.stringify(response, null, 2));
    
    // Handle both response formats
    const rawIdeas = response?.ideas || response?.contentIdeas || response?.content_ideas;
    
    if (!response || !rawIdeas || !Array.isArray(rawIdeas)) {
      console.error('[Idea Generation] Invalid LLM response structure');
      throw new Error('Invalid idea generation response');
    }
    
    // Map formats to lowercase and handle variations
    const ideas = rawIdeas.slice(0, 4).map((idea: Record<string, unknown>) => {
      // Normalize the format
      let format = ((idea.format as string) || 'tweet').toLowerCase();
      if (format.includes('linkedin')) format = 'linkedin';
      if (format.includes('thread')) format = 'thread';
      if (format.includes('blog')) format = 'blog';
      if (format.includes('video') || format.includes('shorts')) format = 'video';
      if (format.includes('tweet') || format === 'twitter') format = 'tweet';
      
      return {
        ...idea,
        format: format as ContentIdea['format']
      };
    });
    console.log('[Idea Generation] Generated', ideas.length, 'ideas');
    return ideas as ContentIdea[];
  } catch (error) {
    console.error('[Idea Generation] LLM generation failed:', error);
    const fallbackIdeas = generateBasicIdeas(context);
    console.log('[Idea Generation] Using', fallbackIdeas.length, 'fallback ideas');
    return fallbackIdeas;
  }
}

// Fallback idea generation without LLM
function generateBasicIdeas(context: IdeaGenerationContext): ContentIdea[] {
  const ideas: ContentIdea[] = [];
  const { event, themes } = context;
  
  // Ensure we have at least one theme
  const mainTheme = themes.themes?.[0] || 'this topic';
  const themeTag = mainTheme.toLowerCase().replace(/\s+/g, '');

  // High engagement = thread opportunity
  if (event.interestScore > 70) {
    ideas.push({
      title: `Deep dive into ${mainTheme}`,
      hook: `I spent ${Math.round(event.sessionLength / 60)} minutes diving into ${mainTheme}. Here's what blew my mind:`,
      format: 'thread',
      estimatedReach: {
        score: 75,
        reasoning: 'Deep dives on trending topics perform well'
      },
      angle: 'Personal learning journey with practical takeaways',
      draftContent: `1/ I spent ${Math.round(event.sessionLength / 60)} minutes diving into ${mainTheme}. Here's what blew my mind:\n\n2/ First key insight from the article...\n\n3/ What this means for builders...\n\n4/ How you can apply this today...\n\n5/ Resources to go deeper:`,
      hashtags: [themeTag, 'buildinpublic', 'learning']
    });
  }

  // Tutorial content = how-to post
  if (themes.contentType === 'tutorial') {
    ideas.push({
      title: `How to implement ${mainTheme} (practical guide)`,
      hook: `Just learned an elegant approach to ${mainTheme}. Here's how you can implement it:`,
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
      ],
      draftContent: `Just spent ${Math.round(event.sessionLength / 60)} minutes diving into ${mainTheme}, and I finally found an approach that clicks. If you've been struggling with this too, here's what made the difference for me.\n\nThe core insight is actually quite simple once you see it. Most tutorials overcomplicate things, but the key is understanding that...\n\n[Continue with specific implementation details based on the actual content]`,
      hashtags: [themeTag, 'tutorial', 'webdev', 'coding']
    });
  }

  // News/announcement = hot take
  if (themes.contentType === 'news' || themes.contentType === 'product') {
    ideas.push({
      title: `Why ${mainTheme} matters for builders`,
      hook: `Everyone's talking about ${event.title?.slice(0, 50) || mainTheme}, but here's what it really means for builders:`,
      format: 'linkedin',
      estimatedReach: {
        score: 70,
        reasoning: 'Timely commentary on news gets engagement'
      },
      angle: 'Builder perspective on industry news',
      draftContent: `Everyone's talking about ${event.title?.slice(0, 50) || mainTheme}, but here's what it really means for builders:\n\nWhile the headlines focus on [mainstream angle], the real opportunity is in [builder angle].\n\nThree immediate actions you can take:\n\n1. [Action 1]\n2. [Action 2]\n3. [Action 3]\n\nThe builders who move on this now will have a significant advantage.\n\nWhat's your take on this development?`,
      hashtags: [themeTag, 'startup', 'innovation', 'buildinpublic']
    });
  }

  // Always include a tweet option
  ideas.push({
    title: `Quick insight on ${mainTheme}`,
    hook: `${themes.keyInsights[0] || `Interesting perspective on ${mainTheme}`} ${event.url}`,
    format: 'tweet',
    estimatedReach: {
      score: 60,
      reasoning: 'Quick insights are shareable'
    },
    angle: 'Concise takeaway with link to source',
    draftContent: `${themes.keyInsights[0] || `Fascinating perspective on ${mainTheme}`}\n\nSpent ${Math.round(event.sessionLength / 60)} minutes on this and it was worth every second.\n\n${event.url}`,
    hashtags: [themeTag, 'buildinpublic']
  });

  return ideas;
}
