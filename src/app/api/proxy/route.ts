import { NextResponse } from 'next/server';
import axios from 'axios';

// List of allowed domains for security
const ALLOWED_DOMAINS = [
  'api.github.com',
  'jsonplaceholder.typicode.com',
  'www.baidu.com'
];

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  // Validate URL domain for security
  try {
    const urlDomain = new URL(url).hostname;
    if (!ALLOWED_DOMAINS.includes(urlDomain)) {
      return new Response('Domain not allowed', { status: 403 });
    }
  } catch (err) {
    console.error('Invalid URL:', err);
    return new Response('Invalid URL', { status: 400 });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching data:', err);
    return new Response('Error fetching data', { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const { url }: { url: string } = await request.json();

  if (!url) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching data:', err);
    return new Response('Error fetching data', { status: 500 });
  }
} 