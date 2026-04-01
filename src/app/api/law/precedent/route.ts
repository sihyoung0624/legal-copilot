import { NextRequest } from 'next/server';

const API_KEY = process.env.LAW_API_KEY || '';

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode') || 'search';
  const query = request.nextUrl.searchParams.get('query') || '';
  const id = request.nextUrl.searchParams.get('id') || '';
  const display = request.nextUrl.searchParams.get('display') || '5';

  try {
    let url: string;

    if (mode === 'text' && id) {
      // 판례 전문 조회
      url = `https://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=prec&ID=${id}&type=JSON`;
    } else {
      // 판례 검색
      if (!query) {
        return Response.json({ success: false, error: 'query parameter required for search' }, { status: 400 });
      }
      url = `https://www.law.go.kr/DRF/lawSearch.do?OC=${API_KEY}&target=prec&type=JSON&query=${encodeURIComponent(query)}&display=${display}`;
    }

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
