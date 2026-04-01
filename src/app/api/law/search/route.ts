import { NextRequest } from 'next/server';

const API_KEY = process.env.LAW_API_KEY || '';
const BASE_URL = 'https://www.law.go.kr/DRF/lawSearch.do';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query');
  const display = request.nextUrl.searchParams.get('display') || '5';

  if (!query) {
    return Response.json({ success: false, error: 'query parameter required' }, { status: 400 });
  }

  try {
    const url = `${BASE_URL}?OC=${API_KEY}&target=law&type=JSON&query=${encodeURIComponent(query)}&display=${display}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const data = await res.json();
    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
