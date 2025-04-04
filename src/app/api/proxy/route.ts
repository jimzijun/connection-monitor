import { NextResponse } from 'next/server';
import axios from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(targetUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        validateStatus: (status) => status < 400
      });

      // Log successful response
      console.log(`Proxy success for ${targetUrl}: ${response.status}`);

      return new NextResponse(response.data, {
        status: response.status,
        headers: {
          'Content-Type': response.headers['content-type'] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (error) {
      lastError = error;
      console.error(`Proxy attempt ${attempt + 1}/${MAX_RETRIES} failed for ${targetUrl}:`, error);
      
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
    }
  }

  // If we get here, all retries failed
  const errorMessage = lastError instanceof Error ? lastError.message : 'Failed to fetch resource';
  console.error(`All proxy attempts failed for ${targetUrl}:`, errorMessage);
  
  return NextResponse.json(
    { error: errorMessage },
    { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
}

// OPTIONS handler for CORS preflight requests
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
} 