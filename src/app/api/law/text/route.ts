import { NextRequest } from 'next/server';

const API_KEY = process.env.LAW_API_KEY || '';

export async function GET(request: NextRequest) {
  const mst = request.nextUrl.searchParams.get('mst');
  const jo = request.nextUrl.searchParams.get('jo') || '';

  if (!mst) {
    return Response.json({ success: false, error: 'mst parameter required' }, { status: 400 });
  }

  try {
    let url = `https://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=law&MST=${mst}&type=JSON`;
    if (jo) {
      // 조문번호 포맷: "제462조" → 그대로 전달
      url += `&JO=${encodeURIComponent(jo)}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const text = await res.text();

    // JSON 파싱 시도 — 일부 응답이 순수 JSON이 아닐 수 있음
    try {
      const data = JSON.parse(text);
      return Response.json({ success: true, data });
    } catch {
      return Response.json({ success: true, data: { rawText: text } });
    }
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
