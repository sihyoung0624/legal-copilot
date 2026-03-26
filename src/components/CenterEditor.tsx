'use client';

import { useStore } from '@/store/useStore';
import { useState, useRef, useEffect } from 'react';
import type { ParagraphStatus } from '@/types';

const statusColor: Record<ParagraphStatus, string> = {
  '초안': 'border-l-gray-300',
  '검토 필요': 'border-l-yellow-400',
  '검증 완료': 'border-l-green-400',
  '수정 완료': 'border-l-blue-400',
};

const statusBadge: Record<ParagraphStatus, string> = {
  '초안': 'bg-gray-100 text-gray-600',
  '검토 필요': 'bg-yellow-100 text-yellow-700',
  '검증 완료': 'bg-green-100 text-green-700',
  '수정 완료': 'bg-blue-100 text-blue-700',
};

export function CenterEditor() {
  const paragraphs = useStore((s) => s.paragraphs);
  const updateParagraph = useStore((s) => s.updateParagraph);
  const lockParagraph = useStore((s) => s.lockParagraph);
  const setParagraphStatus = useStore((s) => s.setParagraphStatus);
  const selectedParagraphId = useStore((s) => s.selectedParagraphId);
  const setSelectedParagraphId = useStore((s) => s.setSelectedParagraphId);
  const runSingleAgent = useStore((s) => s.runSingleAgent);
  const isAgentRunning = useStore((s) => s.isAgentRunning);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editContent]);

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const saveEdit = () => {
    if (editingId) {
      updateParagraph(editingId, editContent);
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  if (paragraphs.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3">&#128221;</div>
          <p className="text-sm">
            상단의 &quot;전체 분석 실행&quot; 버튼을 눌러<br />
            AI 초안을 생성하거나, 직접 작성을 시작하세요.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-white">
      {/* 문서 목차 */}
      <div className="border-b border-gray-100 px-6 py-2 flex items-center gap-3 bg-gray-50">
        <span className="text-xs text-gray-500 font-medium">문서 구조:</span>
        {paragraphs.slice(0, 5).map((p, i) => (
          <button
            key={p.id}
            onClick={() => {
              setSelectedParagraphId(p.id);
              document.getElementById(`para-${p.id}`)?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-[10px] text-blue-600 hover:underline truncate max-w-[120px]"
          >
            {i + 1}. {p.content.split('\n')[0].substring(0, 20)}
          </button>
        ))}
      </div>

      {/* 문단 목록 */}
      <div className="max-w-3xl mx-auto py-6 px-6">
        {paragraphs.map((p, idx) => (
          <div
            key={p.id}
            id={`para-${p.id}`}
            onClick={() => setSelectedParagraphId(p.id)}
            className={`relative mb-4 border-l-4 ${statusColor[p.status]} rounded-r-lg transition fade-in ${
              selectedParagraphId === p.id
                ? 'bg-blue-50 ring-1 ring-blue-200'
                : 'bg-white hover:bg-gray-50'
            } ${p.isLocked ? 'opacity-75' : ''}`}
          >
            {/* 문단 헤더 */}
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">#{idx + 1}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadge[p.status]}`}>
                  {p.status}
                </span>
                <span className={`text-[10px] ${p.source === 'ai' ? 'text-purple-500' : 'text-green-600'}`}>
                  {p.source === 'ai' ? '🤖 AI 생성' : '✍ 직접 작성'}
                </span>
                {p.isLocked && (
                  <span className="text-[10px] text-gray-400">🔒 잠금</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!p.isLocked && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(p.id, p.content); }}
                      className="text-[10px] text-gray-500 hover:text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-50"
                      disabled={editingId === p.id}
                    >
                      &#9998; 수정
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        runSingleAgent('초안작성 에이전트');
                      }}
                      disabled={isAgentRunning}
                      className="text-[10px] text-gray-500 hover:text-purple-600 px-1.5 py-0.5 rounded hover:bg-purple-50"
                    >
                      &#8635; AI 재작성
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); lockParagraph(p.id); }}
                  className="text-[10px] text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-100"
                >
                  {p.isLocked ? '🔓 해제' : '🔒 잠금'}
                </button>
                <select
                  value={p.status}
                  onChange={(e) => setParagraphStatus(p.id, e.target.value as ParagraphStatus)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] border border-gray-200 rounded px-1 py-0.5"
                >
                  <option>초안</option>
                  <option>검토 필요</option>
                  <option>검증 완료</option>
                  <option>수정 완료</option>
                </select>
              </div>
            </div>

            {/* 문단 내용 */}
            <div className="px-4 py-3">
              {editingId === p.id ? (
                <div>
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="editor-textarea border border-blue-200 rounded p-2"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={saveEdit}
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      저장
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {p.content.split(/(\[추가확인 필요[^\]]*\])/).map((part, i) =>
                    part.startsWith('[추가확인 필요') ? (
                      <span key={i} className="bg-yellow-100 text-yellow-800 px-1 rounded text-xs font-medium">
                        {part}
                      </span>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </div>
              )}
            </div>

            {/* 인용 표시 */}
            {p.citations.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {p.citations.map((c) => (
                  <span
                    key={c.id}
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      c.verified === true
                        ? 'bg-green-100 text-green-700'
                        : c.verified === false
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {c.type}: {c.reference}
                    {c.verified === true && ' ✓'}
                    {c.verified === false && ' ✗'}
                    {c.verified === null && ' ?'}
                  </span>
                ))}
              </div>
            )}

            {/* 코멘트 */}
            {p.comments.length > 0 && (
              <div className="px-4 pb-2">
                {p.comments.map((comment, i) => (
                  <div key={i} className="text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded mt-1">
                    💬 {comment}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
