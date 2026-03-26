'use client';

import { useStore } from '@/store/useStore';
import { useState } from 'react';

const suggestedQuestions = [
  '이 자료로 지급명령 가능한지 먼저 봐줘',
  '보전 필요성 부분만 약한 이유를 알려줘',
  '증빙이 약한 문단 표시해줘',
  '판례 인용한 부분만 다시 검증해줘',
];

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const chatMessages = useStore((s) => s.chatMessages);
  const addChatMessage = useStore((s) => s.addChatMessage);
  const currentCaseId = useStore((s) => s.currentCaseId);

  const handleSend = () => {
    if (!input.trim()) return;
    addChatMessage('user', input.trim());
    setInput('');
    // 시뮬레이션: AI 응답
    setTimeout(() => {
      addChatMessage('ai', generateAIResponse(input.trim()));
    }, 1000);
  };

  if (!currentCaseId) return null;

  return (
    <>
      {/* 토글 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center text-lg z-40"
        >
          &#128172;
        </button>
      )}

      {/* 채팅 패널 */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col z-40">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm">&#129302;</span>
              <span className="text-sm font-semibold text-gray-800">AI 어시스턴트</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-lg"
            >
              &#10005;
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">
                  자연어로 질문하거나 지시할 수 있습니다.
                </p>
                <div className="text-[10px] text-gray-400 mb-1">추천 질문:</div>
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      addChatMessage('user', q);
                      setTimeout(() => addChatMessage('ai', generateAIResponse(q)), 1000);
                    }}
                    className="block w-full text-left text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.actions && (
                    <div className="flex gap-1 mt-2 pt-2 border-t border-gray-200">
                      {msg.actions.map((action, i) => (
                        <button
                          key={i}
                          className="text-[10px] px-2 py-0.5 bg-white text-blue-600 rounded hover:bg-blue-50 border border-blue-200"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 입력 영역 */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="질문을 입력하세요..."
                className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function generateAIResponse(question: string): string {
  if (question.includes('지급명령') && question.includes('가능')) {
    return '현재 업로드된 자료를 분석한 결과, 지급명령 신청 가능성을 판단하기 위해 다음이 필요합니다:\n\n1. 금전채권의 존재를 입증할 계약서 또는 차용증\n2. 변제기 도래를 확인할 수 있는 자료\n3. 채무자 특정을 위한 정보\n\n위 자료가 보완되면 보다 정확한 판단이 가능합니다.';
  }
  if (question.includes('보전 필요성')) {
    return '보전 필요성이 약하다고 판단된 이유:\n\n1. 채무자의 재산 은닉 또는 처분 우려를 뒷받침하는 구체적 자료가 부족합니다.\n2. 채무자의 현재 재산 상태를 확인할 수 있는 자료가 없습니다.\n\n보완 방법:\n- 채무자의 재산 처분 시도에 대한 증거\n- 채무자의 재정 상태 악화를 보여주는 자료';
  }
  if (question.includes('증빙') && question.includes('약한')) {
    return '증빙이 약한 문단을 확인했습니다:\n\n- 문단 #4 (청구취지): 청구금액의 근거가 되는 증빙이 첨부되지 않았습니다.\n- 문단 #5 (청구원인): 채권 발생 원인에 대한 구체적 증빙이 부족합니다.\n\n해당 문단들의 상태를 "검토 필요"로 변경하시겠습니까?';
  }
  if (question.includes('판례') && question.includes('검증')) {
    return '현재 초안에 인용된 판례·법조문 검증 결과:\n\n✓ 민사소송법 제462조 - 존재 확인, 현행 유효\n\n추가 인용이 필요한 부분이 있다면 판례/법령 탭에서 검색하실 수 있습니다.';
  }
  return `말씀하신 "${question.substring(0, 30)}..."에 대해 분석 중입니다.\n\n현재 업로드된 자료와 초안을 기반으로 검토하겠습니다. 구체적인 분석 결과는 우측 AI 패널의 해당 탭에서 확인하실 수 있습니다.`;
}
