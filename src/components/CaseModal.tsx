'use client';

import { useStore } from '@/store/useStore';
import { useState } from 'react';
import type { DocumentType, SubDocumentType } from '@/types';

const subTypeMap: Record<DocumentType, SubDocumentType[]> = {
  '지급명령': ['일반'],
  '가압류': ['채권가압류', '부동산가압류', '일반'],
  '가처분': ['처분금지가처분', '점유이전금지가처분', '일반'],
  '기타': ['일반'],
};

export function CaseModal() {
  const setShowCaseModal = useStore((s) => s.setShowCaseModal);
  const createCase = useStore((s) => s.createCase);

  const [caseName, setCaseName] = useState('');
  const [clientName, setClientName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('지급명령');
  const [subDocumentType, setSubDocumentType] = useState<SubDocumentType>('일반');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseName.trim()) return;
    createCase({
      caseName: caseName.trim(),
      clientName: clientName.trim(),
      opponentName: opponentName.trim(),
      documentType,
      subDocumentType,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => setShowCaseModal(false)}
    >
      <div
        className="bg-white rounded-xl p-6 w-[480px] max-h-[80vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          새 사건 생성
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="사건명 *">
            <input
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              placeholder="예: 홍길동 대여금 반환 청구"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
              autoFocus
            />
          </Field>

          <Field label="의뢰인(채권자/신청인)">
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="예: 주식회사 OO"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
            />
          </Field>

          <Field label="상대방(채무자/피신청인)">
            <input
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              placeholder="예: 김OO"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
            />
          </Field>

          <Field label="문서유형">
            <select
              value={documentType}
              onChange={(e) => {
                const dt = e.target.value as DocumentType;
                setDocumentType(dt);
                setSubDocumentType(subTypeMap[dt][0]);
              }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
            >
              <option>지급명령</option>
              <option>가압류</option>
              <option>가처분</option>
              <option>기타</option>
            </select>
            <div className="text-[10px] text-gray-400 mt-1">
              {documentType === '지급명령' && '금전채권 중심 / 구조가 비교적 단순 / 1순위 권장'}
              {documentType === '가압류' && '피보전권리·보전 필요성 정리 중요 / 2순위 권장'}
              {documentType === '가처분' && '유형이 다양하고 난도가 높음 / 3순위 권장'}
              {documentType === '기타' && '기타 법률문서'}
            </div>
          </Field>

          {documentType !== '지급명령' && documentType !== '기타' && (
            <Field label="세부유형">
              <select
                value={subDocumentType}
                onChange={(e) => setSubDocumentType(e.target.value as SubDocumentType)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
              >
                {subTypeMap[documentType].map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </Field>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!caseName.trim()}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              사건 생성
            </button>
            <button
              type="button"
              onClick={() => setShowCaseModal(false)}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
