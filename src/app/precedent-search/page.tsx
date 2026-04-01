'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

// ─── 타입 ───
interface PrecedentListItem {
  id: string;
  caseName: string;
  caseNumber: string;
  courtName: string;
  judgmentDate: string;
  judgmentType: string;
}

interface PrecedentDetail {
  caseName: string;
  caseNumber: string;
  courtName: string;
  judgmentDate: string;
  caseType: string;
  judgmentType: string;
  rulingPoints: string;
  rulingSummary: string;
  refArticles: string;
  refPrecedents: string;
  fullText: string;
}

interface AnalyzedPrecedent {
  info: PrecedentListItem;
  detail: PrecedentDetail | null;
  loading: boolean;
  error: string | null;
  excerpts: Excerpt[];
}

interface Excerpt {
  section: string;
  text: string;
  matchedKeywords: string[];
}

// ─── 키워드로 판례 텍스트에서 관련 문단 추출 ───
function extractExcerpts(detail: PrecedentDetail, contextKeywords: string[]): Excerpt[] {
  if (contextKeywords.length === 0) return [];

  const sections: { name: string; text: string }[] = [
    { name: '판시사항', text: detail.rulingPoints },
    { name: '판결요지', text: detail.rulingSummary },
    { name: '참조조문', text: detail.refArticles },
    { name: '전문', text: detail.fullText },
  ].filter((s) => s.text.length > 0);

  const excerpts: Excerpt[] = [];

  for (const section of sections) {
    // 문단 단위로 분리
    const paragraphs = section.text
      .split(/\n\s*\n|\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    for (const para of paragraphs) {
      const matched = contextKeywords.filter((kw) =>
        para.toLowerCase().includes(kw.toLowerCase()),
      );
      if (matched.length > 0) {
        // 중복 방지 — 같은 텍스트가 이미 있으면 스킵
        const isDup = excerpts.some(
          (e) => e.text === para || para.includes(e.text) || e.text.includes(para),
        );
        if (!isDup) {
          excerpts.push({
            section: section.name,
            text: para,
            matchedKeywords: matched,
          });
        }
      }
    }
  }

  // 관련성 높은 순서 (매칭 키워드 수)
  excerpts.sort((a, b) => b.matchedKeywords.length - a.matchedKeywords.length);
  return excerpts.slice(0, 10);
}

// ─── 키워드 하이라이팅 ───
function HighlightedText({ text, keywords }: { text: string; keywords: string[] }) {
  if (keywords.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = keywords.some(
          (kw) => part.toLowerCase() === kw.toLowerCase(),
        );
        return isMatch ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

// ─── 추천 검색어 ───
const SUGGESTED_SEARCHES = [
  { label: '지급명령', context: '소멸시효 중단' },
  { label: '지급명령', context: '이의신청' },
  { label: '가압류', context: '피보전채권 소명' },
  { label: '가압류', context: '보전의 필요성' },
  { label: '가처분', context: '처분금지' },
  { label: '대여금', context: '변제 입증책임' },
  { label: '임대차', context: '보증금 반환' },
  { label: '매매대금', context: '하자담보' },
];

export default function PrecedentSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [precedents, setPrecedents] = useState<AnalyzedPrecedent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchDone, setSearchDone] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });

  // 판례 검색 + 전문 분석
  const handleSearch = useCallback(async (query?: string, context?: string) => {
    const q = query || searchQuery;
    const ctx = context || contextInput;
    if (!q.trim()) return;

    if (query) setSearchQuery(query);
    if (context) setContextInput(context);

    setIsSearching(true);
    setSearchDone(false);
    setPrecedents([]);
    setAnalysisProgress({ current: 0, total: 0 });

    try {
      // 1. 판례 검색
      const searchRes = await fetch(
        `/api/law/precedent?mode=search&query=${encodeURIComponent(q)}&display=20`,
      );
      const searchJson = await searchRes.json();

      if (!searchJson.success || !searchJson.data?.PrecSearch) {
        setPrecedents([]);
        setTotalCount(0);
        setSearchDone(true);
        setIsSearching(false);
        return;
      }

      const raw = searchJson.data.PrecSearch;
      setTotalCount(parseInt(raw.totalCnt || '0', 10));

      const items: PrecedentListItem[] = (
        Array.isArray(raw.prec) ? raw.prec : raw.prec ? [raw.prec] : []
      ).map((p: Record<string, string>) => ({
        id: p['판례일련번호'] || '',
        caseName: p['사건명'] || '',
        caseNumber: p['사건번호'] || '',
        courtName: p['법원명'] || '',
        judgmentDate: p['선고일자'] || '',
        judgmentType: p['판결유형'] || '',
      }));

      // 초기 상태 세팅
      const initial: AnalyzedPrecedent[] = items.map((info) => ({
        info,
        detail: null,
        loading: true,
        error: null,
        excerpts: [],
      }));
      setPrecedents(initial);
      setAnalysisProgress({ current: 0, total: items.length });

      // 2. 각 판례의 전문을 순차 조회 + 맥락 분석
      const contextKeywords = ctx
        .split(/[,\s]+/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      for (let i = 0; i < items.length; i++) {
        try {
          const textRes = await fetch(`/api/law/precedent-text?id=${items[i].id}`);
          const textJson = await textRes.json();

          if (textJson.success && textJson.data) {
            const detail = textJson.data as PrecedentDetail;
            const excerpts = extractExcerpts(detail, contextKeywords);

            setPrecedents((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, detail, loading: false, excerpts } : p,
              ),
            );
          } else {
            setPrecedents((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, loading: false, error: '전문 조회 실패' } : p,
              ),
            );
          }
        } catch {
          setPrecedents((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, loading: false, error: '네트워크 오류' } : p,
            ),
          );
        }
        setAnalysisProgress({ current: i + 1, total: items.length });
      }
    } catch {
      // 검색 자체 실패
    }

    setIsSearching(false);
    setSearchDone(true);
  }, [searchQuery, contextInput]);

  // 관련 발췌가 있는 판례를 먼저 표시
  const sortedPrecedents = [...precedents].sort((a, b) => {
    if (a.excerpts.length > 0 && b.excerpts.length === 0) return -1;
    if (a.excerpts.length === 0 && b.excerpts.length > 0) return 1;
    return b.excerpts.length - a.excerpts.length;
  });

  const matchedCount = precedents.filter((p) => p.excerpts.length > 0).length;
  const contextKeywords = contextInput
    .split(/[,\s]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">&#9878;</span> 판례 맥락 검색
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              판례를 검색하고, 특정 맥락과 관련된 부분을 자동으로 발췌합니다
            </p>
          </div>
          <Link
            href="/"
            className="text-xs text-blue-600 hover:underline px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
          >
            &#8592; 코파일럿으로 돌아가기
          </Link>
        </div>
      </header>

      {/* 검색 영역 */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                판례 검색어
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="예: 지급명령, 가압류, 대여금, 임대차..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                찾고 싶은 맥락 (쉼표 또는 띄어쓰기로 구분)
              </label>
              <input
                type="text"
                value={contextInput}
                onChange={(e) => setContextInput(e.target.value)}
                placeholder="예: 소멸시효 중단, 이의신청, 입증책임..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => handleSearch()}
                disabled={isSearching || !searchQuery.trim()}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition whitespace-nowrap"
              >
                {isSearching ? '분석 중...' : '검색 + 분석'}
              </button>
            </div>
          </div>

          {/* 추천 검색어 */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-[10px] text-gray-400 py-1">추천:</span>
            {SUGGESTED_SEARCHES.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSearch(s.label, s.context)}
                disabled={isSearching}
                className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-100 hover:text-blue-700 transition disabled:opacity-50"
              >
                {s.label} &middot; {s.context}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 진행 상태 */}
      {isSearching && analysisProgress.total > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 shrink-0">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs text-blue-700 mb-1">
                <span>
                  판례 전문 분석 중... ({analysisProgress.current}/{analysisProgress.total})
                </span>
                <span>{Math.round((analysisProgress.current / analysisProgress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${(analysisProgress.current / analysisProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 결과 요약 */}
      {searchDone && (
        <div className="bg-white border-b border-gray-200 px-6 py-2.5 shrink-0">
          <div className="max-w-5xl mx-auto flex items-center gap-4 text-xs">
            <span className="text-gray-500">
              전체 <strong className="text-gray-900">{totalCount}</strong>건 중{' '}
              <strong className="text-gray-900">{precedents.length}</strong>건 분석 완료
            </span>
            {contextKeywords.length > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-amber-700">
                  맥락 키워드 일치:{' '}
                  <strong className="text-amber-900">{matchedCount}</strong>건
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-400">
                  키워드:{' '}
                  {contextKeywords.map((kw, i) => (
                    <span key={i} className="inline-block bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded mr-1">
                      {kw}
                    </span>
                  ))}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 결과 목록 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-5xl mx-auto space-y-4">
          {!searchDone && precedents.length === 0 && !isSearching && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">&#128269;</div>
              <h2 className="text-lg font-medium text-gray-700 mb-2">판례 맥락 검색</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                판례 검색어로 관련 판례를 찾고,
                <br />
                맥락 키워드를 입력하면 각 판례의 전문을 읽어서
                <br />
                해당 맥락과 관련된 부분만 자동으로 발췌합니다.
              </p>
              <div className="mt-6 p-4 bg-amber-50 rounded-lg max-w-md mx-auto text-left">
                <p className="text-xs font-medium text-amber-800 mb-2">사용 예시</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  1. 검색어: <strong>지급명령</strong> / 맥락: <strong>소멸시효 중단</strong>
                  <br />
                  &rarr; 지급명령 관련 판례 중 소멸시효 중단이 언급된 부분만 발췌
                </p>
                <p className="text-xs text-amber-700 leading-relaxed mt-2">
                  2. 검색어: <strong>가압류</strong> / 맥락: <strong>피보전채권 소명</strong>
                  <br />
                  &rarr; 가압류 판례에서 피보전채권 소명 관련 판시 부분 추출
                </p>
              </div>
            </div>
          )}

          {sortedPrecedents.map((prec, idx) => (
            <PrecedentCard
              key={prec.info.id || idx}
              prec={prec}
              contextKeywords={contextKeywords}
            />
          ))}

          {searchDone && precedents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">검색 결과가 없습니다. 다른 키워드를 시도해 보세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 px-6 py-2 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[10px] text-gray-400">
          <span>법제처 Open API 실시간 연동 | 판례 데이터 출처: 국가법령정보센터</span>
          <span>법률문서 코파일럿 &middot; 판례 맥락 검색</span>
        </div>
      </footer>
    </div>
  );
}

// ─── 판례 카드 컴포넌트 ───
function PrecedentCard({
  prec,
  contextKeywords,
}: {
  prec: AnalyzedPrecedent;
  contextKeywords: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const hasExcerpts = prec.excerpts.length > 0;

  return (
    <div
      className={`bg-white rounded-xl border ${
        hasExcerpts ? 'border-amber-200 shadow-sm' : 'border-gray-200'
      } overflow-hidden`}
    >
      {/* 헤더 */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {hasExcerpts && (
              <span className="shrink-0 text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-medium">
                맥락 일치 {prec.excerpts.length}건
              </span>
            )}
            {prec.loading && (
              <span className="shrink-0 text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                분석 중
              </span>
            )}
            {prec.error && (
              <span className="shrink-0 text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full">
                {prec.error}
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-900 leading-snug">
            <HighlightedText text={prec.info.caseName} keywords={contextKeywords} />
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
            <span className="font-mono">{prec.info.caseNumber}</span>
            <span className="text-gray-300">|</span>
            <span>{prec.info.courtName || 'N/A'}</span>
            <span className="text-gray-300">|</span>
            <span>{prec.info.judgmentDate}</span>
            {prec.info.judgmentType && (
              <>
                <span className="text-gray-300">|</span>
                <span>{prec.info.judgmentType}</span>
              </>
            )}
          </div>
        </div>
        {prec.detail && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 text-[10px] px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition"
          >
            {expanded ? '접기' : '전문 보기'}
          </button>
        )}
      </div>

      {/* 맥락 발췌 */}
      {hasExcerpts && (
        <div className="border-t border-amber-100 bg-amber-50/30 px-4 py-3 space-y-2.5">
          <p className="text-[10px] font-medium text-amber-700 flex items-center gap-1">
            <span>&#128270;</span> 맥락 관련 발췌
          </p>
          {prec.excerpts.map((excerpt, i) => (
            <div key={i} className="bg-white rounded-lg border border-amber-100 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                  {excerpt.section}
                </span>
                {excerpt.matchedKeywords.map((kw, ki) => (
                  <span
                    key={ki}
                    className="text-[9px] px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded"
                  >
                    {kw}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                <HighlightedText text={excerpt.text} keywords={contextKeywords} />
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 판시사항 요약 (발췌가 없을 때) */}
      {!hasExcerpts && prec.detail?.rulingPoints && !expanded && (
        <div className="border-t border-gray-100 px-4 py-2.5">
          <p className="text-[10px] text-gray-400 mb-1">판시사항</p>
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
            <HighlightedText
              text={prec.detail.rulingPoints.substring(0, 200)}
              keywords={contextKeywords}
            />
            {prec.detail.rulingPoints.length > 200 && '...'}
          </p>
        </div>
      )}

      {/* 전문 보기 (확장) */}
      {expanded && prec.detail && (
        <div className="border-t border-gray-200 px-4 py-4 space-y-4 bg-gray-50/50 max-h-[600px] overflow-y-auto">
          {prec.detail.rulingPoints && (
            <DetailSection title="판시사항" text={prec.detail.rulingPoints} keywords={contextKeywords} />
          )}
          {prec.detail.rulingSummary && (
            <DetailSection title="판결요지" text={prec.detail.rulingSummary} keywords={contextKeywords} />
          )}
          {prec.detail.refArticles && (
            <DetailSection title="참조조문" text={prec.detail.refArticles} keywords={contextKeywords} />
          )}
          {prec.detail.refPrecedents && (
            <DetailSection title="참조판례" text={prec.detail.refPrecedents} keywords={contextKeywords} />
          )}
          {prec.detail.fullText && (
            <DetailSection title="전문" text={prec.detail.fullText} keywords={contextKeywords} />
          )}
        </div>
      )}
    </div>
  );
}

function DetailSection({
  title,
  text,
  keywords,
}: {
  title: string;
  text: string;
  keywords: string[];
}) {
  return (
    <div>
      <p className="text-[10px] font-medium text-gray-500 mb-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
        {title}
      </p>
      <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap bg-white rounded-lg border border-gray-100 p-3">
        <HighlightedText text={text} keywords={keywords} />
      </div>
    </div>
  );
}
