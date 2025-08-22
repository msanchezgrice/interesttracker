import * as cheerio from 'cheerio';

export interface PageMetadata {
  description?: string;
  keywords?: string[];
  ogImage?: string;
  author?: string;
  publishedDate?: string;
  mainContent?: string;
}

export async function extractPageMetadata(url: string): Promise<PageMetadata> {
  try {
    // Fetch the page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MakerPulse/1.0; +https://makerpulse.app/bot)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract metadata
    const metadata: PageMetadata = {
      description: $('meta[name="description"]').attr('content') || 
                   $('meta[property="og:description"]').attr('content'),
      keywords: extractKeywords($),
      ogImage: $('meta[property="og:image"]').attr('content'),
      author: $('meta[name="author"]').attr('content') ||
              $('meta[property="article:author"]').attr('content'),
      publishedDate: $('meta[property="article:published_time"]').attr('content') ||
                     $('time[datetime]').first().attr('datetime'),
      mainContent: extractMainContent($)
    };
    
    return metadata;
  } catch (error) {
    console.error('Failed to scrape metadata:', error);
    return {};
  }
}

function extractKeywords($: cheerio.CheerioAPI): string[] {
  const keywords: string[] = [];
  
  // From meta keywords
  const metaKeywords = $('meta[name="keywords"]').attr('content');
  if (metaKeywords) {
    keywords.push(...metaKeywords.split(',').map(k => k.trim()));
  }
  
  // From article tags
  $('meta[property="article:tag"]').each((_, el) => {
    const tag = $(el).attr('content');
    if (tag) keywords.push(tag);
  });
  
  return [...new Set(keywords)]; // Remove duplicates
}

function extractMainContent($: cheerio.CheerioAPI): string {
  // Remove script and style elements
  $('script, style, nav, header, footer').remove();
  
  // Try to find main content areas
  const contentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.content',
    '#content',
    '.post-content',
    '.entry-content'
  ];
  
  let content = '';
  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length) {
      content = element.text().trim();
      break;
    }
  }
  
  // Fallback to body if no content area found
  if (!content) {
    content = $('body').text().trim();
  }
  
  // Clean up whitespace
  content = content.replace(/\s+/g, ' ').trim();
  
  // Limit to first 2000 chars for analysis
  return content.substring(0, 2000);
}
