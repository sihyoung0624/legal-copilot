'use client';

import { useStore } from '@/store/useStore';
import { useState } from 'react';
import type { AITabType } from '@/types';

const tabs: { key: AITabType; label: string }[] = [
  { key: '절차추천', label: '절차' },
  { key: '사실관계', label: '사실' },
  { key: '요건점검', label: '요건' },
  { key: '판례법령', label: '판례' },
  { key: '추가자료', label: '보완' },
  { key: '불명확항목', label: '불명확' },
  { key: '리스크', label: '리스크' },
  { key: '실행로그', label: '로그' },
];

const requirementStatusStyle: Record<string, string> = {
  '충족': 'bg-green-100 text-green-700',
  '일부충족': 'bg-yellow-100 text-yellow-700',
  '부족': 'bg-red-100 text-red-700',
  '미확인': 'bg-gray-100 text-gray-600',
};

export function RightPanel() {
  const activeTab = useStore((s) => s.activeAITab);
  const setActiveTab = useStore((s) => s.setActiveAITab);
  const procedureRec = useStore((s) => s.procedureRecommendation);
  const factSummary = useStore((s) => s.factSummary);
  const reqCheck = useStore((s) => s.requirementCheck);
  const citationVers = useStore((s) => s.citationVerifications);
  const supplementReqs = useStore((s) => s.supplementRequests);
  const unclearItems = useStore((s) => s.unclearItems);
  const riskWarnings = useStore((s) => s.riskWarnings);
  const executionLogs = useStore((s) => s.executionLogs);
  const runSingleAgent = useStore((s) => s.runSingleAgent);
  const isAgentRunning = useStore((s) => s.isAgentRunning);
  const feasibility = useStore((s) => s.feasibility);
  const liveLawArticles = useStore((s) => s.liveLawArticles);
  const livePrecedents = useStore((s) => s.livePrecedents);

  const [supplementResponses, setSupplementResponses] = useState<Record<string, string>>({});
  const [unclearResponses, setUnclearResponses] = useState<Record<string, string>>({});

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-hidden">
      {/* 탭 바 */}
      <div className="flex flex-wrap border-b border-gray-200 px-1 py-1 gap-0.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-2 py-1 text-[10px] rounded font-medium transition ${
              activeTab === t.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t.label}
            {t.key === '리스크' && riskWarnings.length > 0 && (
              <span className="ml-0.5 px-1 bg-red-500 text-white rounded-full text-[8px]">
                {riskWarnings.length}
              </span>
            )}
            {t.key === '추가자료' && supplementReqs.filter(s => s.status === '대기중').length > 0 && (
              <span className="ml-0.5 px-1 bg-yellow-500 text-white rounded-full text-[8px]">
                {supplementReqs.filter(s => s.status === '대기중').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* 절차 추천 */}
        {activeTab === '절차추천' && (
          <div className="space-y-3 fade-in">
            {!procedureRec ? (
              <EmptyState text="전체 분석을 실행하면 절차 추천이 표시됩니다" />
            ) : (
              <>
                <Section title="추천 절차">
                  <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-medium text-sm text-blue-800">{procedureRec.recommended}</div>
                    <div className="text-xs text-blue-600 mt-1">{procedureRec.reason}</div>
                  </div>
                </Section>
                <Section title="대체 가능한 절차">
                  {procedureRec.alternatives.map((alt, i) => (
                    <div key={i} className="text-xs text-gray-600 py-1">
                      &#8226; {alt}
                    </div>
                  ))}
                </Section>
                <Section title="추가 확인 질문">
                  {procedureRec.additionalQuestions.map((q, i) => (
                    <div key={i} className="text-xs text-gray-700 bg-yellow-50 p-2 rounded mb-1">
                      &#10067; {q}
                    </div>
                  ))}
                </Section>
                <ActionButton
                  label="절차 재분석"
                  onClick={() => runSingleAgent('문서분류·절차선정 에이전트')}
                  disabled={isAgentRunning}
                />
              </>
            )}
          </div>
        )}

        {/* 사실관계 */}
        {activeTab === '사실관계' && (
          <div className="space-y-3 fade-in">
            {!factSummary ? (
              <EmptyState text="전체 분석을 실행하면 사실관계가 표시됩니다" />
            ) : (
              <>
                <Section title="당사자">
                  {factSummary.parties.map((p, i) => (
                    <div key={i} className="text-xs text-gray-700 py-0.5">
                      <span className="text-gray-500">{p.role}:</span> {p.name}
                    </div>
                  ))}
                </Section>
                <Section title="금액">
                  <div className="text-xs text-gray-700">{factSummary.amount}</div>
                </Section>
                <Section title="날짜">
                  {factSummary.dates.map((d, i) => (
                    <div key={i} className="text-xs text-gray-700 py-0.5">
                      <span className="text-gray-500">{d.label}:</span> {d.value}
                    </div>
                  ))}
                </Section>
                <Section title="확인된 사실">
                  {factSummary.confirmedFacts.map((f, i) => (
                    <div key={i} className="text-xs text-green-700 bg-green-50 p-1.5 rounded mb-1">
                      &#10003; {f}
                    </div>
                  ))}
                </Section>
                {factSummary.conflictingFacts.length > 0 && (
                  <Section title="충돌되는 사실">
                    {factSummary.conflictingFacts.map((f, i) => (
                      <div key={i} className="text-xs text-red-700 bg-red-50 p-1.5 rounded mb-1">
                        &#9888; {f}
                      </div>
                    ))}
                  </Section>
                )}
                <Section title="미확인 사실">
                  {factSummary.unconfirmedFacts.map((f, i) => (
                    <div key={i} className="text-xs text-gray-600 bg-gray-50 p-1.5 rounded mb-1">
                      &#10067; {f}
                    </div>
                  ))}
                </Section>
                <ActionButton
                  label="사실관계 재추출"
                  onClick={() => runSingleAgent('사실관계 추출 에이전트')}
                  disabled={isAgentRunning}
                />
              </>
            )}
          </div>
        )}

        {/* 요건 점검 */}
        {activeTab === '요건점검' && (
          <div className="space-y-3 fade-in">
            {!reqCheck ? (
              <EmptyState text="전체 분석을 실행하면 요건 점검 결과가 표시됩니다" />
            ) : (
              <>
                {/* 진행 가능성 표시 */}
                {feasibility && (
                  <FeasibilityBadge level={feasibility} />
                )}

                <Section title={`${reqCheck.procedureName} 필수요건`}>
                  {reqCheck.requirements.map((r, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-2.5 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-800">{r.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${requirementStatusStyle[r.status]}`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-600">
                        <div><span className="text-gray-400">이유:</span> {r.reason}</div>
                        <div><span className="text-gray-400">근거:</span> {r.evidenceDoc}</div>
                        <div><span className="text-gray-400">추가 필요:</span> {r.additionalNeeded}</div>
                      </div>
                    </div>
                  ))}
                </Section>
                <Section title="서면 포함 필수 논점">
                  {reqCheck.keyPoints.map((p, i) => (
                    <div key={i} className="text-xs text-gray-700 py-0.5">&#8226; {p}</div>
                  ))}
                </Section>
                {reqCheck.risks.length > 0 && (
                  <Section title="현재 위험요소">
                    {reqCheck.risks.map((r, i) => (
                      <div key={i} className="text-xs text-red-700 bg-red-50 p-1.5 rounded mb-1">
                        &#9888; {r}
                      </div>
                    ))}
                  </Section>
                )}
                <ActionButton
                  label="요건 재점검"
                  onClick={() => runSingleAgent('요건점검 에이전트')}
                  disabled={isAgentRunning}
                />
              </>
            )}
          </div>
        )}

        {/* 판례/법령 검증 */}
        {activeTab === '판례법령' && (
          <div className="space-y-3 fade-in">
            {citationVers.length === 0 && !isAgentRunning ? (
              <EmptyState text="초안 작성 후 인용 검증 결과가 표시됩니다" />
            ) : isAgentRunning && citationVers.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs text-blue-600 font-medium">법제처 API에서 실시간 검증 중...</p>
                <p className="text-[10px] text-gray-400 mt-1">법령 조문 및 관련 판례를 검색하고 있습니다</p>
              </div>
            ) : (
              <>
                {/* 인용 검증 결과 */}
                <Section title={`인용 검증 결과 (${citationVers.length}건)`}>
                  {citationVers.filter(c => c.type === '법조문').length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] text-gray-400 font-medium mb-1">법조문</p>
                      {citationVers.filter(c => c.type === '법조문').map((c, i) => (
                        <div key={`law-${i}`} className="border border-gray-100 rounded-lg p-2.5 mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-800">{c.item}</span>
                            <div className="flex items-center gap-1">
                              {c.isLiveVerified && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">API 검증</span>
                              )}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                c.exists === true ? 'bg-green-100 text-green-700' :
                                c.exists === false ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {c.exists === true ? '존재 확인' : c.exists === false ? '검증 실패' : '미확인'}
                              </span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-600">
                            <div><span className="text-gray-400">출처:</span> {c.source}</div>
                            <div><span className="text-gray-400">관련성:</span> {c.relevance}</div>
                            {c.note && <div className="mt-1 p-1.5 bg-gray-50 rounded text-[10px] text-gray-700 leading-relaxed">{c.note}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {citationVers.filter(c => c.type === '판례').length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] text-gray-400 font-medium mb-1">관련 판례</p>
                      {citationVers.filter(c => c.type === '판례').map((c, i) => (
                        <div key={`prec-${i}`} className="border border-gray-100 rounded-lg p-2.5 mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-800 leading-tight">{c.item}</span>
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              {c.isLiveVerified && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">API</span>
                              )}
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">확인</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-600">
                            <div><span className="text-gray-400">출처:</span> {c.source}</div>
                            {c.note && <div className="mt-1 text-[10px] text-gray-500 leading-relaxed">{c.note}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                {/* 법령 조문 전문 */}
                {liveLawArticles.length > 0 && (
                  <Section title={`관련 법령 조문 (${liveLawArticles.length}건)`}>
                    {liveLawArticles.map((art, i) => (
                      <details key={i} className="border border-blue-100 rounded-lg mb-2 group">
                        <summary className="p-2.5 cursor-pointer hover:bg-blue-50 transition rounded-lg">
                          <span className="text-xs font-medium text-blue-800">
                            {art.lawName} {art.articleNumber}
                          </span>
                          {art.articleTitle && (
                            <span className="text-[10px] text-blue-500 ml-1">({art.articleTitle})</span>
                          )}
                        </summary>
                        <div className="px-3 pb-3 text-[11px] text-gray-700 leading-relaxed border-t border-blue-50 pt-2 bg-blue-50/30">
                          {art.articleContent}
                        </div>
                      </details>
                    ))}
                  </Section>
                )}

                {/* 관련 판례 목록 */}
                {livePrecedents.length > 0 && (
                  <Section title={`관련 판례 목록 (${livePrecedents.length}건)`}>
                    {livePrecedents.map((prec, i) => (
                      <div key={i} className="border border-amber-100 rounded-lg p-2.5 mb-2 bg-amber-50/30">
                        <div className="text-xs font-medium text-amber-900 leading-tight mb-1">{prec.caseName}</div>
                        <div className="text-[10px] text-amber-700 space-y-0.5">
                          <div>사건번호: {prec.caseNumber}</div>
                          <div>법원: {prec.courtName || 'N/A'} | 선고일: {prec.judgmentDate}</div>
                          {prec.judgmentType && <div>유형: {prec.judgmentType}</div>}
                        </div>
                      </div>
                    ))}
                  </Section>
                )}

                {liveLawArticles.length > 0 && (
                  <div className="text-center py-2">
                    <span className="text-[9px] text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                      법제처 Open API 실시간 연동
                    </span>
                  </div>
                )}

                <ActionButton
                  label="인용 재검증"
                  onClick={() => runSingleAgent('판례·인용 검증 에이전트')}
                  disabled={isAgentRunning}
                />
              </>
            )}
          </div>
        )}

        {/* 추가자료 요청 */}
        {activeTab === '추가자료' && (
          <div className="space-y-3 fade-in">
            {supplementReqs.length === 0 ? (
              <EmptyState text="분석 후 필요한 추가자료가 표시됩니다" />
            ) : (
              <>
                {supplementReqs.map((req) => (
                  <div key={req.id} className="border border-gray-100 rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-800">{req.description}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        req.status === '대기중' ? 'bg-yellow-100 text-yellow-700' :
                        req.status === '사용자 응답 완료' ? 'bg-green-100 text-green-700' :
                        req.status === '재검증 완료' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-600 mb-2">
                      <div><span className="text-gray-400">필요 이유:</span> {req.reason}</div>
                      <div><span className="text-gray-400">예시:</span> {req.example}</div>
                    </div>
                    {req.status === '대기중' && (
                      <div className="space-y-1.5">
                        <textarea
                          value={supplementResponses[req.id] || ''}
                          onChange={(e) => setSupplementResponses(prev => ({ ...prev, [req.id]: e.target.value }))}
                          placeholder="응답 입력 또는 자료 설명..."
                          className="w-full text-xs border border-gray-200 rounded p-2 resize-none"
                          rows={2}
                        />
                        <div className="flex gap-1">
                          <button className="text-[10px] px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                            응답 제출
                          </button>
                          <button className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                            자료 업로드
                          </button>
                          <button className="text-[10px] px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200">
                            현재 자료만으로 진행
                          </button>
                          <button className="text-[10px] px-2 py-1 text-gray-400 hover:text-gray-600">
                            보류
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* 불명확 항목 */}
        {activeTab === '불명확항목' && (
          <div className="space-y-3 fade-in">
            {unclearItems.length === 0 ? (
              <EmptyState text="분석 후 불명확한 항목이 표시됩니다" />
            ) : (
              <>
                {unclearItems.map((item) => (
                  <div key={item.id} className="border border-orange-200 rounded-lg p-3 mb-2 bg-orange-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-800">&#9888; {item.description}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        item.status === '대기중' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-600 mb-2">
                      <span className="text-gray-400">이유:</span> {item.reason}
                    </div>
                    {item.status === '대기중' && (
                      <div className="space-y-1.5">
                        <textarea
                          value={unclearResponses[item.id] || ''}
                          onChange={(e) => setUnclearResponses(prev => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="확인 결과 입력..."
                          className="w-full text-xs border border-gray-200 rounded p-2 resize-none bg-white"
                          rows={2}
                        />
                        <div className="flex gap-1">
                          <button className="text-[10px] px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                            확인 완료
                          </button>
                          <button className="text-[10px] px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200">
                            추후 확인
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <ActionButton
                  label="재검증 실행"
                  onClick={() => runSingleAgent('최종검토·리스크표시 에이전트')}
                  disabled={isAgentRunning}
                />
              </>
            )}
          </div>
        )}

        {/* 리스크 */}
        {activeTab === '리스크' && (
          <div className="space-y-3 fade-in">
            {riskWarnings.length === 0 ? (
              <EmptyState text="최종 검토 후 리스크가 표시됩니다" />
            ) : (
              <>
                <div className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded">
                  &#9432; 이 판단은 내부검토 참고용이며, 법률전문가의 최종 확인이 필요합니다.
                </div>
                {riskWarnings.map((risk) => (
                  <div
                    key={risk.id}
                    className={`border rounded-lg p-3 mb-2 ${
                      risk.level === '높음' ? 'border-red-300 bg-red-50' :
                      risk.level === '중간' ? 'border-yellow-300 bg-yellow-50' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        risk.level === '높음' ? 'bg-red-200 text-red-800' :
                        risk.level === '중간' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {risk.level}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {risk.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-800 mb-1">{risk.description}</div>
                    <div className="text-[10px] text-gray-600">
                      <span className="text-gray-400">권고:</span> {risk.suggestion}
                    </div>
                    <button className="text-[10px] text-blue-600 hover:underline mt-1.5">
                      이 부분 다시 분석 &#8599;
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* 실행 로그 */}
        {activeTab === '실행로그' && (
          <div className="space-y-2 fade-in">
            {executionLogs.length === 0 ? (
              <EmptyState text="에이전트 실행 기록이 표시됩니다" />
            ) : (
              [...executionLogs].reverse().map((log) => (
                <div key={log.id} className="p-2 rounded border border-gray-100 text-xs">
                  <div className="flex items-center gap-1.5">
                    {log.status === 'running' && <span className="running-dot" />}
                    {log.status === 'success' && <span className="text-green-600">&#10003;</span>}
                    {log.status === 'failed' && <span className="text-red-600">&#10007;</span>}
                    <span className="font-medium">{log.agentName}</span>
                  </div>
                  <div className="text-gray-500 mt-0.5">{log.action}</div>
                  {log.usedDocuments.length > 0 && (
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      사용 자료: {log.usedDocuments.join(', ')}
                    </div>
                  )}
                  <div className="text-gray-400 mt-0.5 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

// 공용 컴포넌트
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center text-gray-400 py-8 text-xs">{text}</div>
  );
}

function ActionButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2 text-xs rounded-lg font-medium transition ${
        disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {disabled ? <><span className="running-dot mr-1" /> 실행 중...</> : <>{label}</>}
    </button>
  );
}

function FeasibilityBadge({ level }: { level: string }) {
  const config: Record<string, { color: string; bg: string; border: string }> = {
    '진행 가능성이 높음': { color: 'text-green-800', bg: 'bg-green-50', border: 'border-green-300' },
    '보완 후 진행 가능': { color: 'text-yellow-800', bg: 'bg-yellow-50', border: 'border-yellow-300' },
    '법률적 쟁점 큼': { color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-300' },
    '현재 자료만으로는 권고 어려움': { color: 'text-red-800', bg: 'bg-red-50', border: 'border-red-300' },
  };
  const c = config[level] || config['보완 후 진행 가능'];
  return (
    <div className={`p-3 rounded-lg border ${c.border} ${c.bg} mb-3`}>
      <div className={`text-xs font-bold ${c.color}`}>&#9432; 청구 가능성 평가</div>
      <div className={`text-sm font-semibold ${c.color} mt-1`}>{level}</div>
      <div className="text-[10px] text-gray-500 mt-1">
        ※ 내부검토 참고용이며, 법률전문가의 최종 판단이 필요합니다.
      </div>
    </div>
  );
}
