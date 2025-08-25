// Enhanced scraper with support for Google's URL context API and other methods

export interface EnhancedPageContent {
  title: string;
  description: string;
  fullContent: string;
  mainPoints: string[];
  quotes: string[];
  metadata: {
    author?: string;
    publishDate?: string;
    readTime?: string;
    videoTranscript?: string;
  };
}

// Google's URL Context API implementation
async function scrapeWithGoogleAPI(url: string): Promise<EnhancedPageContent | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return null;
    }

    console.log('[Google URL Context] Fetching content for:', url);
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this URL and extract the following information in a structured format:
            
            URL: ${url}
            
            Please extract:
            1. title: The main title of the page/video/document
            2. description: A brief summary (100-200 chars)
            3. mainContent: The main content or key information (up to 2000 chars)
            4. keyPoints: List of 3-5 main points or takeaways
            5. quotes: Any notable quotes or statements (if available)
            6. author: Author name (if available)
            7. publishDate: Publication date (if available)
            8. For YouTube videos: Include what the video is specifically about
            
            Format the response as JSON.`
          }]
        }],
        tools: [{
          url_context: {}
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    console.log('[Google URL Context] Response received');
    
    // Extract the content from the response
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const extractedData = JSON.parse(data.candidates[0].content.parts[0].text);
      
      return {
        title: extractedData.title || '',
        description: extractedData.description || '',
        fullContent: extractedData.mainContent || '',
        mainPoints: extractedData.keyPoints || [],
        quotes: extractedData.quotes || [],
        metadata: {
          author: extractedData.author,
          publishDate: extractedData.publishDate,
          videoTranscript: extractedData.videoTranscript
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Google URL Context API error:', error);
    return null;
  }
}

// YouTube content is now handled by Google URL Context API
async function extractYouTubeContent(url: string): Promise<Partial<EnhancedPageContent> | null> {
  // Google's URL Context API handles YouTube videos automatically
  // No need for separate YouTube API integration
  return scrapeWithGoogleAPI(url);
}

// Main enhanced scraping function
export async function enhancedScrape(url: string): Promise<EnhancedPageContent> {
  // Try Google API first
  const googleResult = await scrapeWithGoogleAPI(url);
  if (googleResult) return googleResult;
  
  // Special handling for YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const youtubeContent = await extractYouTubeContent(url);
    if (youtubeContent) {
      return {
        title: youtubeContent.title || '',
        description: youtubeContent.description || '',
        fullContent: youtubeContent.metadata?.videoTranscript || '',
        mainPoints: [],
        quotes: [],
        metadata: youtubeContent.metadata || {}
      };
    }
  }
  
  // Fallback to basic fetch (server-side rendering)
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MakerPulse/1.0)'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    
    // Basic extraction from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    
    // Extract main content (simplified)
    let mainContent = '';
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const contentMatch = articleMatch || mainMatch;
    
    if (contentMatch) {
      // Strip HTML tags
      mainContent = contentMatch[1]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    return {
      title: titleMatch ? titleMatch[1].trim() : '',
      description: descMatch ? descMatch[1].trim() : '',
      fullContent: mainContent.slice(0, 5000), // Limit content length
      mainPoints: [],
      quotes: [],
      metadata: {}
    };
  } catch (error) {
    console.error('Enhanced scraping error:', error);
    return {
      title: '',
      description: '',
      fullContent: '',
      mainPoints: [],
      quotes: [],
      metadata: {}
    };
  }
}

// Helper to extract key points from content
export function extractKeyPoints(content: string): string[] {
  const points: string[] = [];
  
  // Look for numbered lists
  const numberedPoints = content.match(/\d+\.\s+([^\n]+)/g);
  if (numberedPoints) {
    points.push(...numberedPoints.map(p => p.replace(/^\d+\.\s+/, '').trim()));
  }
  
  // Look for bullet points
  const bulletPoints = content.match(/[•·-]\s+([^\n]+)/g);
  if (bulletPoints) {
    points.push(...bulletPoints.map(p => p.replace(/^[•·-]\s+/, '').trim()));
  }
  
  return points.slice(0, 5); // Return top 5 points
}
