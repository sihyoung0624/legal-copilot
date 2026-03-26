'use client';

import { useStore } from '@/store/useStore';

export function TopBar() {
  const cases = useStore((s) => s.cases);
  const currentCaseId = useStore((s) => s.currentCaseId);
  const isAgentRunning = useStore((s) => s.isAgentRunning);
  const runAgentPipeline = useStore((s) => s.runAgentPipeline);
  const feasibility = useStore((s) => s.feasibility);
  const riskWarnings = useStore((s) => s.riskWarnings);
  const saveVersion = useStore((s) => s.saveVersion);

  const currentCase = cases.find((c) => c.id === currentCaseId);
  const highRisks = riskWarnings.filter((r) => r.level === '높음');

  const feasibilityColor: Record<string, string> = {
    '진행 가능성이 높음': 'bg-green-500',
    '보완 후 진행 가능': 'bg-yellow-500',
    '법률적 쟁점 큼': 'bg-orange-500',
    '현재 자료만으로는 권고 어려움': 'bg-red-500',
  };

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0">
      {/* 로고 */}
      <div className="flex items-center gap-2 mr-4">
        <span className="text-lg">&#9878;</span>
        <span className="font-bold text-sm text-gray-800">법률문서 코파일럿</span>
      </div>

      {currentCase && (
        <>
          {/* 사건명 */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-gray-900">{currentCase.caseName}</span>
            <span className="text-gray-400">|</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              {currentCase.documentType}
            </span>
            {currentCase.subDocumentType !== '일반' && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                {currentCase.subDocumentType}
              </span>
            )}
          </div>

          {/* 진행상태 */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-400">상태:</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">
              {currentCase.status}
            </span>
          </div>

          {/* 진행 가능성 신호등 */}
          {feasibility && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-3 h-3 rounded-full ${feasibilityColor[feasibility] || 'bg-gray-400'}`} />
              <span className="text-gray-600">{feasibility}</span>
            </div>
          )}

          {/* 높은 위험 경고 */}
          {highRisks.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
              &#9888; 높은 위험 {highRisks.length}건
            </div>
          )}

          <div className="flex-1" />

          {/* 액션 버튼들 */}
          <button
            onClick={() => saveVersion(
              `v${new Date().toLocaleTimeString('ko-KR')}`,
              '수동 저장'
            )}
            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
          >
            &#128190; 버전 저장
          </button>

          <button
            onClick={runAgentPipeline}
            disabled={isAgentRunning}
            className={`px-4 py-1.5 text-xs rounded font-medium transition flex items-center gap-1.5 ${
              isAgentRunning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isAgentRunning ? (
              <>
                <span className="running-dot" />
                분석 중...
              </>
            ) : (
              <>&#9654; 전체 분석 실행</>
            )}
          </button>
        </>
      )}
    </header>
  );
}
