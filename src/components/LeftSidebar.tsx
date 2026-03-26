'use client';

import { useStore } from '@/store/useStore';
import { useState } from 'react';
import type { FileTag, FileGroup, CaseFileTag, CommonFileTag, CommonFileTarget } from '@/types';

const sidebarTabs = [
  { key: 'cases' as const, label: '사건', icon: '📋' },
  { key: 'files' as const, label: '자료', icon: '📎' },
  { key: 'versions' as const, label: '버전', icon: '📄' },
  { key: 'history' as const, label: '이력', icon: '🕐' },
];

const caseFileTags: CaseFileTag[] = ['계약서', '차용증', '송금내역', '내용증명', '세금계산서', '문자/이메일', '등기부등본', '스캔문서', '내부메모', '기타증빙'];
const commonFileTags: CommonFileTag[] = ['업무지침', '내부매뉴얼', '기본판례', '유권해석', '이론자료', '샘플서면', '절차템플릿', '체크리스트'];
const fileGroups: FileGroup[] = ['신청인 자료', '상대방 자료', '법리자료', '증빙자료'];
const commonTargets: CommonFileTarget[] = ['전체', '지급명령', '가압류', '가처분'];

const reliabilityColor: Record<string, string> = {
  '원본 확인됨': 'text-green-600',
  'OCR 결과만 있음': 'text-yellow-600',
  '일부 불명확': 'text-orange-600',
  '재확인 필요': 'text-red-600',
};

const tagIcon: Record<string, string> = {
  '업무지침': '📘', '내부매뉴얼': '📖', '기본판례': '⚖', '유권해석': '📜',
  '이론자료': '📚', '샘플서면': '📝', '절차템플릿': '📋', '체크리스트': '✅',
};

export function LeftSidebar() {
  const tab = useStore((s) => s.leftSidebarTab);
  const setTab = useStore((s) => s.setLeftSidebarTab);
  const cases = useStore((s) => s.cases);
  const currentCaseId = useStore((s) => s.currentCaseId);
  const selectCase = useStore((s) => s.selectCase);
  const setShowCaseModal = useStore((s) => s.setShowCaseModal);
  const files = useStore((s) => s.files);
  const commonFiles = useStore((s) => s.commonFiles);
  const addFile = useStore((s) => s.addFile);
  const addCommonFile = useStore((s) => s.addCommonFile);
  const toggleKeyDocument = useStore((s) => s.toggleKeyDocument);
  const removeFile = useStore((s) => s.removeFile);
  const removeCommonFile = useStore((s) => s.removeCommonFile);
  const versions = useStore((s) => s.versions);
  const restoreVersion = useStore((s) => s.restoreVersion);
  const executionLogs = useStore((s) => s.executionLogs);

  const [dragOver, setDragOver] = useState(false);
  const [fileSubTab, setFileSubTab] = useState<'case' | 'common'>('case');
  const [newCaseTag, setNewCaseTag] = useState<CaseFileTag>('기타증빙');
  const [newCaseGroup, setNewCaseGroup] = useState<FileGroup>('신청인 자료');
  const [newCommonTag, setNewCommonTag] = useState<CommonFileTag>('업무지침');
  const [newCommonTarget, setNewCommonTarget] = useState<CommonFileTarget>('전체');

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    for (let i = 0; i < droppedFiles.length; i++) {
      const f = droppedFiles[i];
      if (fileSubTab === 'case') {
        addFile({ fileName: f.name, fileType: f.type, fileSize: f.size, tag: newCaseTag, group: newCaseGroup, scope: 'case' });
      } else {
        addCommonFile({ fileName: f.name, fileType: f.type, fileSize: f.size, tag: newCommonTag, commonTarget: newCommonTarget } as any);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    for (let i = 0; i < selectedFiles.length; i++) {
      const f = selectedFiles[i];
      if (fileSubTab === 'case') {
        addFile({ fileName: f.name, fileType: f.type, fileSize: f.size, tag: newCaseTag, group: newCaseGroup, scope: 'case' });
      } else {
        addCommonFile({ fileName: f.name, fileType: f.type, fileSize: f.size, tag: newCommonTag, commonTarget: newCommonTarget } as any);
      }
    }
    e.target.value = '';
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden">
      {/* 메인 탭 */}
      <div className="flex border-b border-gray-200">
        {sidebarTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs font-medium transition ${
              tab === t.key
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* ===== 사건 목록 ===== */}
        {tab === 'cases' && (
          <div className="space-y-2">
            <button
              onClick={() => setShowCaseModal(true)}
              className="w-full py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              + 새 사건 생성
            </button>
            {cases.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">생성된 사건이 없습니다</p>
            )}
            {cases.map((c) => (
              <div
                key={c.id}
                onClick={() => selectCase(c.id)}
                className={`p-3 rounded-lg cursor-pointer border transition ${
                  c.id === currentCaseId
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm text-gray-900">{c.caseName}</div>
                <div className="text-xs text-gray-500 mt-1">{c.documentType} | {c.status}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {c.clientName && `${c.clientName}`}
                  {c.opponentName && ` vs ${c.opponentName}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== 자료 관리 ===== */}
        {tab === 'files' && (
          <div className="space-y-3">
            {/* 사건별 / 공통 서브탭 */}
            <div className="flex rounded-lg bg-gray-100 p-0.5">
              <button
                onClick={() => setFileSubTab('case')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                  fileSubTab === 'case' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
                }`}
              >
                📁 사건별 자료
                <span className="ml-1 text-[10px] px-1 bg-blue-100 text-blue-600 rounded-full">{files.length}</span>
              </button>
              <button
                onClick={() => setFileSubTab('common')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                  fileSubTab === 'common' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'
                }`}
              >
                📚 공통자료
                <span className="ml-1 text-[10px] px-1 bg-purple-100 text-purple-600 rounded-full">{commonFiles.length}</span>
              </button>
            </div>

            {/* 안내 문구 */}
            <div className={`text-[10px] p-2 rounded-lg ${fileSubTab === 'case' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
              {fileSubTab === 'case'
                ? '현재 사건에만 적용되는 자료 (계약서, 송금내역, 증빙 등)'
                : '모든 사건에서 공통으로 참조하는 자료 (업무지침, 판례, 템플릿 등)'}
            </div>

            {/* 업로드 영역 */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-lg p-3 text-center transition ${
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <p className="text-[10px] text-gray-500 mb-1.5">파일을 드래그하거나 클릭하여 업로드</p>
              <input type="file" multiple onChange={handleFileInput} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="px-3 py-1 text-xs bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
                파일 선택
              </label>
            </div>

            {/* 태그/분류 선택 */}
            {fileSubTab === 'case' ? (
              <div className="flex gap-2">
                <select value={newCaseTag} onChange={(e) => setNewCaseTag(e.target.value as CaseFileTag)} className="flex-1 text-xs border border-gray-200 rounded px-2 py-1">
                  {caseFileTags.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
                <select value={newCaseGroup} onChange={(e) => setNewCaseGroup(e.target.value as FileGroup)} className="flex-1 text-xs border border-gray-200 rounded px-2 py-1">
                  {fileGroups.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <select value={newCommonTag} onChange={(e) => setNewCommonTag(e.target.value as CommonFileTag)} className="flex-1 text-xs border border-gray-200 rounded px-2 py-1">
                  {commonFileTags.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
                <select value={newCommonTarget} onChange={(e) => setNewCommonTarget(e.target.value as CommonFileTarget)} className="flex-1 text-xs border border-gray-200 rounded px-2 py-1">
                  {commonTargets.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
            )}

            {/* ===== 사건별 자료 목록 ===== */}
            {fileSubTab === 'case' && (
              <>
                {files.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">이 사건에 업로드된 자료가 없습니다</p>
                )}
                {files.map((f) => (
                  <div
                    key={f.id}
                    className={`p-2.5 rounded-lg border transition ${
                      f.isKeyDocument ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100'
                    } ${f.isCitedInDraft ? 'ring-1 ring-blue-200' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">{f.fileName}</div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]">{f.tag}</span>
                          <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px]">{f.group}</span>
                          <span className={`text-[10px] ${reliabilityColor[f.reliability]}`}>{f.reliability}</span>
                        </div>
                        {f.ocrStatus === 'completed' && (
                          <div className="text-[10px] text-yellow-600 mt-0.5">🔍 OCR 처리됨</div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-1">
                        <button onClick={() => toggleKeyDocument(f.id)} title={f.isKeyDocument ? '핵심자료 해제' : '핵심자료 지정'} className="text-xs px-1 hover:bg-gray-100 rounded">
                          {f.isKeyDocument ? '★' : '☆'}
                        </button>
                        <button onClick={() => removeFile(f.id)} className="text-xs text-red-400 px-1 hover:bg-red-50 rounded">✕</button>
                      </div>
                    </div>
                    {f.isCitedInDraft && (
                      <div className="text-[10px] text-blue-600 mt-1">🔗 초안에서 인용됨</div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* ===== 공통자료 목록 ===== */}
            {fileSubTab === 'common' && (
              <>
                {commonFiles.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">등록된 공통자료가 없습니다</p>
                )}
                {/* 태그별 그룹 표시 */}
                {Array.from(new Set(commonFiles.map(f => f.tag))).map((tagGroup) => (
                  <div key={tagGroup} className="mb-3">
                    <div className="text-[10px] font-bold text-purple-700 mb-1.5 flex items-center gap-1">
                      <span>{tagIcon[tagGroup] || '📄'}</span>
                      <span>{tagGroup}</span>
                      <span className="text-gray-400 font-normal">({commonFiles.filter(f => f.tag === tagGroup).length})</span>
                    </div>
                    {commonFiles.filter(f => f.tag === tagGroup).map((f) => (
                      <div key={f.id} className="p-2 rounded-lg border border-purple-100 bg-purple-50/30 mb-1.5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">{f.fileName}</div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {f.commonTarget && f.commonTarget !== '전체' && (
                                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px]">
                                  {f.commonTarget}용
                                </span>
                              )}
                              {f.commonTarget === '전체' && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
                                  전체 공통
                                </span>
                              )}
                              {f.isKeyDocument && (
                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px]">★ 핵심</span>
                              )}
                            </div>
                            {f.description && (
                              <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">{f.description}</div>
                            )}
                          </div>
                          <button onClick={() => removeCommonFile(f.id)} className="text-xs text-red-400 px-1 hover:bg-red-50 rounded ml-1">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ===== 버전 목록 ===== */}
        {tab === 'versions' && (
          <div className="space-y-2">
            {versions.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">저장된 버전이 없습니다</p>
            )}
            {versions.map((v) => (
              <div key={v.id} className="p-2.5 rounded-lg border border-gray-100 hover:border-gray-200">
                <div className="text-xs font-medium text-gray-900">{v.versionName}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{v.description}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(v.createdAt).toLocaleString('ko-KR')} | {v.createdBy === 'ai' ? 'AI 생성' : '사용자 저장'}
                </div>
                <button onClick={() => restoreVersion(v.id)} className="mt-1.5 text-[10px] text-blue-600 hover:underline">
                  이 버전으로 복원
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ===== 작업 이력 ===== */}
        {tab === 'history' && (
          <div className="space-y-2">
            {executionLogs.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">실행 이력이 없습니다</p>
            )}
            {[...executionLogs].reverse().map((log) => (
              <div key={log.id} className="p-2 rounded border border-gray-100 text-xs">
                <div className="flex items-center gap-1.5">
                  {log.status === 'running' && <span className="running-dot" />}
                  {log.status === 'success' && <span className="text-green-600">✓</span>}
                  {log.status === 'failed' && <span className="text-red-600">✗</span>}
                  <span className="font-medium text-gray-900">{log.agentName}</span>
                </div>
                <div className="text-gray-500 mt-0.5">{log.action}</div>
                <div className="text-gray-400 mt-0.5 text-[10px]">
                  {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
