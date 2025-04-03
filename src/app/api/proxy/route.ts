import { NextResponse } from 'next/server';
import axios from 'axios';

// List of allowed domains for security
const ALLOWED_DOMAINS = [
  'api.github.com',
  'jsonplaceholder.typicode.com',
  'www.baidu.com'
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Validate URL domain for security
  try {
    const urlDomain = new URL(url).hostname;
    if (!ALLOWED_DOMAINS.includes(urlDomain)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Accept all status codes less than 500
      headers: {
        'User-Agent': 'Connection-Monitor/1.0',
        'Accept': 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    return NextResponse.json({
      data: response.data,
      status: response.status,
      headers: response.headers
    });
  } catch (error: any) {
    console.error('Proxy request failed:', error.message);
    
    // Return more specific error information
    return NextResponse.json({
      error: 'Request failed',
      details: error.message,
      code: error.code
    }, { 
      status: error.response?.status || 500 
    });
  }
}

export async function POST(request: Request): Promise<Response> {
  const data: { url: string } = await request.json();
  // ... existing code ...
} 