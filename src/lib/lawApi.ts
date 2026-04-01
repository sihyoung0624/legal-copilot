// 법제처 Open API 클라이언트 서비스
// Next.js API Route를 통해 서버사이드에서 법제처 API를 호출합니다.

export interface LawSearchResult {
  lawId: string;
  lawName: string;
  mst: string;
  promulgationDate: string;
  enforcementDate: string;
  lawType: string;
}

export interface LawArticleResult {
  lawName: string;
  articleNumber: string;
  articleTitle: string;
  articleContent: string;
}

export interface PrecedentResult {
  id: string;
  caseName: string;
  caseNumber: string;
  courtName: string;
  judgmentDate: string;
  judgmentType: string;
}

export interface PrecedentDetail {
  caseName: string;
  caseNumber: string;
  courtName: string;
  judgmentDate: string;
  summary: string;
  fullText: string;
}

// 문서유형별 관련 법령 매핑
const DOC_TYPE_LAW_MAP: Record<string, { laws: string[]; keywords: string[] }> = {
  '지급명령': {
    laws: ['민사소송법'],
    keywords: ['지급명령', '대여금', '금전채권'],
  },
  '가압류': {
    laws: ['민사집행법', '민사소송법'],
    keywords: ['가압류', '보전처분', '피보전채권'],
  },
  '가처분': {
    laws: ['민사집행법', '민사소송법'],
    keywords: ['가처분', '처분금지', '보전처분'],
  },
};

// ─── 법령 검색 ───
export async function searchLaw(query: string, display = 5): Promise<LawSearchResult[]> {
  try {
    const res = await fetch(`/api/law/search?query=${encodeURIComponent(query)}&display=${display}`);
    const json = await res.json();
    if (!json.success || !json.data?.LawSearch) return [];

    const raw = json.data.LawSearch;
    const laws = Array.isArray(raw.law) ? raw.law : raw.law ? [raw.law] : [];

    return laws.map((l: Record<string, string>) => ({
      lawId: l['법령ID'] || '',
      lawName: l['법령명한글'] || '',
      mst: l['법령일련번호'] || '',
      promulgationDate: l['공포일자'] || '',
      enforcementDate: l['시행일자'] || '',
      lawType: l['법령구분명'] || '',
    }));
  } catch {
    return [];
  }
}

// ─── 법령 조문 조회 ───
export async function getLawArticle(mst: string, jo: string): Promise<LawArticleResult | null> {
  try {
    const res = await fetch(`/api/law/text?mst=${mst}&jo=${encodeURIComponent(jo)}`);
    const json = await res.json();
    if (!json.success) return null;

    const data = json.data;

    // 조문 데이터 추출 — API 응답 구조에 따라 파싱
    if (data?.법령?.조문?.조문단위) {
      const articles = Array.isArray(data.법령.조문.조문단위)
        ? data.법령.조문.조문단위
        : [data.법령.조문.조문단위];

      const article = articles[0];
      if (article) {
        return {
          lawName: data.법령?.기본정보?.법령명_한글 || '',
          articleNumber: article.조문번호 || jo,
          articleTitle: article.조문제목 || '',
          articleContent: article.조문내용 || '',
        };
      }
    }

    // rawText 폴백
    if (data?.rawText) {
      return {
        lawName: '',
        articleNumber: jo,
        articleTitle: '',
        articleContent: data.rawText.substring(0, 500),
      };
    }

    return null;
  } catch {
    return null;
  }
}

// ─── 판례 검색 ───
export async function searchPrecedents(query: string, display = 5): Promise<PrecedentResult[]> {
  try {
    const res = await fetch(`/api/law/precedent?mode=search&query=${encodeURIComponent(query)}&display=${display}`);
    const json = await res.json();
    if (!json.success || !json.data?.PrecSearch) return [];

    const raw = json.data.PrecSearch;
    const precs = Array.isArray(raw.prec) ? raw.prec : raw.prec ? [raw.prec] : [];

    return precs.map((p: Record<string, string>) => ({
      id: p['판례일련번호'] || '',
      caseName: p['사건명'] || '',
      caseNumber: p['사건번호'] || '',
      courtName: p['법원명'] || '',
      judgmentDate: p['선고일자'] || '',
      judgmentType: p['판결유형'] || '',
    }));
  } catch {
    return [];
  }
}

// ─── 판례 전문 조회 ───
export async function getPrecedentDetail(id: string): Promise<PrecedentDetail | null> {
  try {
    const res = await fetch(`/api/law/precedent?mode=text&id=${id}`);
    const json = await res.json();
    if (!json.success) return null;

    const data = json.data;
    // 판례 전문 응답 구조 파싱
    const prec = data?.PrecService || data;
    return {
      caseName: prec['사건명'] || '',
      caseNumber: prec['사건번호'] || '',
      courtName: prec['법원명'] || '',
      judgmentDate: prec['선고일자'] || '',
      summary: prec['판례내용'] || prec['요지'] || '',
      fullText: prec['판결요지'] || prec['전문'] || '',
    };
  } catch {
    return null;
  }
}

// ─── 문서유형에 맞는 법령/판례 자동 검색 ───
export async function fetchLegalDataForDocType(docType: string) {
  const config = DOC_TYPE_LAW_MAP[docType] || DOC_TYPE_LAW_MAP['지급명령'];

  // 1. 관련 법령 검색 (병렬)
  const lawSearchPromises = config.laws.map((name) => searchLaw(name, 3));
  const lawResults = (await Promise.all(lawSearchPromises)).flat();

  // 2. 주요 조문 조회 — 첫 번째 법령의 핵심 조문
  const articles: LawArticleResult[] = [];
  const KEY_ARTICLES: Record<string, { mstFallback: string; articles: string[] }> = {
    '민사소송법': { mstFallback: '252393', articles: ['제462조', '제463조', '제464조', '제470조'] },
    '민사집행법': { mstFallback: '252358', articles: ['제276조', '제277조', '제280조', '제300조'] },
  };

  for (const lawName of config.laws) {
    const found = lawResults.find((l) => l.lawName.includes(lawName));
    const mst = found?.mst || KEY_ARTICLES[lawName]?.mstFallback || '';
    const artNumbers = KEY_ARTICLES[lawName]?.articles || [];

    if (mst && artNumbers.length > 0) {
      // 핵심 조문만 조회 (최대 3개, 병렬)
      const artPromises = artNumbers.slice(0, 3).map((jo) => getLawArticle(mst, jo));
      const artResults = await Promise.all(artPromises);
      for (const art of artResults) {
        if (art) articles.push(art);
      }
    }
  }

  // 3. 관련 판례 검색 (첫 번째 키워드)
  const precedents = await searchPrecedents(config.keywords[0], 5);

  return { lawResults, articles, precedents };
}
