'use client';

import { TopBar } from '@/components/TopBar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { CenterEditor } from '@/components/CenterEditor';
import { RightPanel } from '@/components/RightPanel';
import { ChatPanel } from '@/components/ChatPanel';
import { CaseModal } from '@/components/CaseModal';
import { useStore } from '@/store/useStore';

export default function Home() {
  const currentCaseId = useStore((s) => s.currentCaseId);
  const showCaseModal = useStore((s) => s.showCaseModal);

  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        {currentCaseId ? (
          <>
            <CenterEditor />
            <RightPanel />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">&#9878;</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                법률문서 코파일럿
              </h2>
              <p className="text-gray-500 mb-6 max-w-md">
                법률전문가의 내부업무를 자동화하는 멀티 에이전트 시스템입니다.
                <br />
                사건을 생성하거나 선택하여 시작하세요.
              </p>
              <button
                onClick={() => useStore.getState().setShowCaseModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                + 새 사건 생성
              </button>
            </div>
          </div>
        )}
      </div>
      <ChatPanel />
      {showCaseModal && <CaseModal />}
    </div>
  );
}
