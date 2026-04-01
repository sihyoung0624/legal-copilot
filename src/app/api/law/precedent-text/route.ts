import { NextRequest } from 'next/server';

const API_KEY = process.env.LAW_API_KEY || '';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return Response.json({ success: false, error: 'id parameter required' }, { status: 400 });
  }

  try {
    const url = `https://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=prec&ID=${id}&type=JSON`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const text = await res.text();

    try {
      const data = JSON.parse(text);
      const prec = data?.PrecService || data;

      // HTML 태그 정리
      const clean = (s: string) =>
        (s || '')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

      return Response.json({
        success: true,
        data: {
          caseName: clean(prec['사건명'] || ''),
          caseNumber: clean(prec['사건번호'] || ''),
          courtName: clean(prec['법원명'] || ''),
          judgmentDate: clean(prec['선고일자'] || ''),
          caseType: clean(prec['사건종류명'] || ''),
          judgmentType: clean(prec['판결유형'] || ''),
          rulingPoints: clean(prec['판시사항'] || ''),
          rulingSummary: clean(prec['판결요지'] || ''),
          refArticles: clean(prec['참조조문'] || ''),
          refPrecedents: clean(prec['참조판례'] || ''),
          fullText: clean(prec['판례내용'] || ''),
        },
      });
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
