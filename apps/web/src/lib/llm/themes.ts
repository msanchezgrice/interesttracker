import { getLLM } from './index';
import type { PageMetadata } from '../scraper';

export interface ThemeAnalysis {
  themes: string[];      // High-level themes (2-4)
  contentTags: string[]; // Specific tags (5-10)
  contentType: 'tutorial' | 'news' | 'analysis' | 'product' | 'discussion' | 'reference';
  keyInsights: string[]; // Key takeaways (2-3)
  technicalLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
}

export async function analyzePageThemes(
  metadata: PageMetadata,
  event: { title?: string | null; url: string; domain: string }
): Promise<ThemeAnalysis> {
  const llm = getLLM();
  
  // Fallback to basic analysis if no LLM available
  if (!llm) {
    return basicThemeAnalysis(metadata, event);
  }

  const prompt = `
Analyze this webpage content and extract structured insights.

Title: ${event.title || 'Untitled'}
URL: ${event.url}
Domain: ${event.domain}
Description: ${metadata.description || 'No description'}
Keywords: ${metadata.keywords?.join(', ') || 'None'}
Content excerpt: ${metadata.mainContent?.slice(0, 1500) || 'No content available'}

Extract the following:
1. Main themes (2-4 high-level topics this content covers)
2. Content tags (5-10 specific keywords that categorize this content)
3. Content type (one of: tutorial, news, analysis, product, discussion, reference)
4. Key insights (2-3 main takeaways a reader would get)
5. Technical level (beginner, intermediate, advanced, or mixed)

Focus on accuracy and relevance. Be specific rather than generic.
`;

  try {
    const analysis = await llm.completeJSON<ThemeAnalysis>(prompt);
    
    // Validate and clean the response
    return {
      themes: (analysis.themes || []).slice(0, 4),
      contentTags: (analysis.contentTags || []).slice(0, 10),
      contentType: analysis.contentType || 'reference',
      keyInsights: (analysis.keyInsights || []).slice(0, 3),
      technicalLevel: analysis.technicalLevel || 'mixed'
    };
  } catch (error) {
    console.error('LLM theme analysis failed:', error);
    return basicThemeAnalysis(metadata, event);
  }
}

// Fallback theme analysis without LLM
function basicThemeAnalysis(
  metadata: PageMetadata,
  event: { title?: string | null; url: string; domain: string }
): ThemeAnalysis {
  const text = `${event.title || ''} ${metadata.description || ''} ${metadata.keywords?.join(' ') || ''}`.toLowerCase();
  
  // Domain-based defaults
  const domainThemes: Record<string, string[]> = {
    'github.com': ['Open Source', 'Development'],
    'youtube.com': ['Video Content', 'Learning'],
    'substack.com': ['Newsletter', 'Writing'],
    'news.ycombinator.com': ['Tech News', 'Discussion'],
    'medium.com': ['Articles', 'Insights'],
    'stackoverflow.com': ['Q&A', 'Programming'],
    'twitter.com': ['Social Media', 'Updates'],
    'linkedin.com': ['Professional', 'Networking']
  };

  // Keyword-based theme detection
  const themes: string[] = [];
  if (text.match(/\b(ai|artificial intelligence|machine learning|ml|deep learning)\b/)) {
    themes.push('Artificial Intelligence');
  }
  if (text.match(/\b(react|vue|angular|frontend|ui|ux)\b/)) {
    themes.push('Frontend Development');
  }
  if (text.match(/\b(node|python|backend|api|database|server)\b/)) {
    themes.push('Backend Development');
  }
  if (text.match(/\b(startup|founder|entrepreneur|business|funding)\b/)) {
    themes.push('Startups & Business');
  }
  if (text.match(/\b(product|management|roadmap|metrics|analytics)\b/)) {
    themes.push('Product Management');
  }

  // Add domain themes if no specific themes found
  if (themes.length === 0) {
    const domainKey = Object.keys(domainThemes).find(d => event.domain.includes(d));
    if (domainKey) {
      themes.push(...domainThemes[domainKey]);
    } else {
      themes.push('Technology', 'General');
    }
  }

  // Extract tags
  const tags = new Set<string>();
  
  // From metadata keywords
  metadata.keywords?.forEach(k => tags.add(k.toLowerCase()));
  
  // Common tech tags
  const techTags = ['javascript', 'typescript', 'python', 'react', 'nodejs', 'api', 'database', 'cloud', 'devops', 'security'];
  techTags.forEach(tag => {
    if (text.includes(tag)) tags.add(tag);
  });

  // Content type detection
  let contentType: ThemeAnalysis['contentType'] = 'reference';
  if (text.includes('tutorial') || text.includes('how to') || text.includes('guide')) {
    contentType = 'tutorial';
  } else if (text.includes('announcement') || text.includes('launched') || text.includes('introducing')) {
    contentType = 'news';
  } else if (text.includes('analysis') || text.includes('deep dive') || text.includes('explained')) {
    contentType = 'analysis';
  } else if (event.domain.includes('github.com') && event.url.includes('/issues/')) {
    contentType = 'discussion';
  }

  return {
    themes: themes.slice(0, 4),
    contentTags: Array.from(tags).slice(0, 10),
    contentType,
    keyInsights: [`Content about ${themes[0] || 'technology'}`],
    technicalLevel: 'mixed'
  };
}
