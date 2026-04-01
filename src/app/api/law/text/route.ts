import { NextRequest } from 'next/server';

const API_KEY = process.env.LAW_API_KEY || '';

// "제462조" → 462 추출
function extractArticleNum(jo: string): number {
  const match = jo.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export async function GET(request: NextRequest) {
  const mst = request.nextUrl.searchParams.get('mst');
  const jo = request.nextUrl.searchParams.get('jo') || '';

  if (!mst) {
    return Response.json({ success: false, error: 'mst parameter required' }, { status: 400 });
  }

  try {
    // 전체 법령을 가져와서 조문을 필터링
    const url = `https://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=law&MST=${mst}&type=JSON`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const text = await res.text();

    try {
      const data = JSON.parse(text);

      // 특정 조문 요청 시 필터링
      if (jo && data?.법령?.조문?.조문단위) {
        const targetNum = extractArticleNum(jo);
        const allArticles = Array.isArray(data.법령.조문.조문단위)
          ? data.법령.조문.조문단위
          : [data.법령.조문.조문단위];

        const found = allArticles.find((a: Record<string, string>) => {
          const num = extractArticleNum(a['조문번호'] || '');
          return num === targetNum;
        });

        if (found) {
          return Response.json({
            success: true,
            data: {
              lawName: data.법령?.기본정보?.법령명_한글 || '',
              articleNumber: found['조문번호'] || jo,
              articleTitle: found['조문제목'] || '',
              articleContent: found['조문내용'] || '',
            },
          });
        }
      }

      // 조문 지정 없거나 못 찾은 경우 전체 반환
      return Response.json({ success: true, data });
    } catch {
      return Response.json({ success: true, data: { rawText: text } });
    }
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
