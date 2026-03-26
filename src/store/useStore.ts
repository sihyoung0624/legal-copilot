'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  CaseInfo, CaseStatus, DocumentType, SubDocumentType,
  UploadedFile, FileTag, FileReliability, FileGroup, FileScope, CommonFileTarget,
  Paragraph, ParagraphStatus, DocumentVersion,
  AITabType, ChatMessage,
  ProcedureRecommendation, FactSummary, RequirementCheck,
  CitationVerification, SupplementRequest, UnclearItem,
  RiskWarning, ExecutionLog, FeasibilityLevel,
} from '@/types';

interface AppState {
  // === 사건 목록 ===
  cases: CaseInfo[];
  currentCaseId: string | null;
  createCase: (data: Partial<CaseInfo>) => void;
  selectCase: (id: string) => void;
  updateCaseStatus: (status: CaseStatus) => void;

  // === 자료 (사건별) ===
  files: UploadedFile[];
  addFile: (file: Partial<UploadedFile>) => void;
  toggleKeyDocument: (id: string) => void;
  removeFile: (id: string) => void;
  updateFileTag: (id: string, tag: FileTag) => void;

  // === 공통자료 (시스템 전체) ===
  commonFiles: UploadedFile[];
  addCommonFile: (file: Partial<UploadedFile>) => void;
  removeCommonFile: (id: string) => void;

  // === 문서 편집 ===
  paragraphs: Paragraph[];
  setParagraphs: (paragraphs: Paragraph[]) => void;
  updateParagraph: (id: string, content: string) => void;
  lockParagraph: (id: string) => void;
  setParagraphStatus: (id: string, status: ParagraphStatus) => void;

  // === 버전 관리 ===
  versions: DocumentVersion[];
  currentVersionId: string | null;
  saveVersion: (name: string, description: string) => void;
  restoreVersion: (id: string) => void;

  // === AI 패널 ===
  activeAITab: AITabType;
  setActiveAITab: (tab: AITabType) => void;

  // === AI 분석 결과 ===
  procedureRecommendation: ProcedureRecommendation | null;
  factSummary: FactSummary | null;
  requirementCheck: RequirementCheck | null;
  citationVerifications: CitationVerification[];
  supplementRequests: SupplementRequest[];
  unclearItems: UnclearItem[];
  riskWarnings: RiskWarning[];
  executionLogs: ExecutionLog[];
  feasibility: FeasibilityLevel | null;

  // === 에이전트 실행 ===
  isAgentRunning: boolean;
  runAgentPipeline: () => Promise<void>;
  runSingleAgent: (agentName: string) => Promise<void>;

  // === 대화형 인터페이스 ===
  chatMessages: ChatMessage[];
  addChatMessage: (role: 'user' | 'ai', content: string) => void;

  // === UI 상태 ===
  showCaseModal: boolean;
  setShowCaseModal: (show: boolean) => void;
  selectedParagraphId: string | null;
  setSelectedParagraphId: (id: string | null) => void;
  leftSidebarTab: 'cases' | 'files' | 'history' | 'versions';
  setLeftSidebarTab: (tab: 'cases' | 'files' | 'history' | 'versions') => void;
}

const now = () => new Date().toISOString();

// ===== 데모용 공통자료 (시스템 초기 데이터) =====
function createInitialCommonFiles(): UploadedFile[] {
  return [
    {
      id: uuidv4(), fileName: '[지침] 지급명령 신청 업무 매뉴얼 v3.2.pdf', fileType: 'application/pdf', fileSize: 2450000,
      scope: 'common', tag: '업무지침', reliability: '원본 확인됨', group: '법리자료',
      uploadedAt: '2025-12-01T09:00:00Z', ocrStatus: 'none', isKeyDocument: true, isCitedInDraft: false, excludeFromAI: false,
      commonTarget: '지급명령', description: '지급명령 신청서 작성 절차, 필수 기재사항, 첨부서류 안내',
    },
    {
      id: uuidv4(), fileName: '[지침] 가압류 신청 실무 가이드 v2.1.pdf', fileType: 'application/pdf', fileSize: 3100000,
      scope: 'common', tag: '업무지침', reliability: '원본 확인됨', group: '법리자료',
      uploadedAt: '2025-11-15T09:00:00Z', ocrStatus: 'none', isKeyDocument: true, isCitedInDraft: false, excludeFromAI: false,
      commonTarget: '가압류', description: '가압류 신청서 작성, 피보전권리 소명, 보전 필요성 기재 요령',
    },
    {
      id: uuidv4(), fileName: '[판례] 대법원 2019다223781 대여금 반환.pdf', fileType: 'application/pdf', fileSize: 890000,
      scope: 'common', tag: '기본판례', reliability: '원본 확인됨', group: '법리자료',
      uploadedAt: '2025-10-20T09:00:00Z', ocrStatus: 'none', isKeyDocument: false, isCitedInDraft: false, excludeFromAI: false,
      commonTarget: '전체', description: '대여금 채권의 성립요건과 입증책임에 관한 대표 판례',
    },
    {
      id: uuidv4(), fileName: '[판례] 대법원 2020마5678 가압류 보전필요성.pdf', fileType: 'application/pdf', fileSize: 750000,
      scope: 'common', tag: '기본판례', reliability: '원본 확인됨', group: '법리자료',
      uploadedAt: '2025-10-20T09:00:00Z', ocrStatus: 'none', isKeyDocument: false, isCitedInDraft: false, excludeFromAI: false,
      commonTarget: '가압류', description: '보전의 필요성 판단 기준과 소명 정도에 관한 판례',
    },
    {
      id: uuidv4(), fileName: '[유권해석] 법원행정처 보전처분 실무제요 발췌.pdf', fileType: 'application/pdf', fileSize: 1200000,
      scope: 'common', tag: '유권해석', reliability: '원본 확인됨', group: '법리자료',
      uploadedAt: '2025-09-05T09:00:00Z', ocrStatus: 'none', isKeyDocument: false, isCitedInDraft: false, excludeFromAI: false,
      commonTarget: '전체', description: '법원행정처 발간 보전처분 실무제요 중 가압류·가처분 관련 부분',
    },
    {
      id: uuidv4(), fileName: '[템플릿] 지급명령 신청서 표준양식.docx', fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 45000,
      scope: 'common', tag: '절차템플릿', reliability: '원본 확인됨', group: '법리자료',
      uploadedAt: '2025-08-10T09:00:00Z', ocrStatus: 'none', isKeyDocument: true, isCitedInDraft: false, excludeFromAI: false,
      commonTarget: '지급명령', description: '사무실 표준 지급명령 신청서 양식',
    },
    {
      id: uuidv4(), fileName: '[템플릿] 채권가압류 신청서 표준양식.docx', fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 52000,
      scope: 'common', tag: '절차템플릿', reliability: '원본 확인됨', group: '법리자료',
      uploadedAt: '2025-08-10T09:00:00Z', ocrStatus: 'none', isKeyDocument: true, isCitedInDraft: false, excludeFromAI: false,
      commonTarget: '가압류', description: '사무실 표준 채권가압류 신청서 양식',
    },
    {
      id: uuidv4(), fileName: '[샘플] 지급명령 신청서 좋은 예시 (김OO 사건).pdf', fileType: 'application/pdf', fileSize: 680000,
      scope: 'common', tag: '샘플서면', reliability: '원본 확인됨', group: '법리자료',
      uploadedAt: '2025-07-01T09:00:00Z', ocrStatus: 'none', isKeyDocument: false, isCitedInDraft: false, excludeFromAI: false,
      commonTarget: '지급명령', description: '실제 인용된 우수 서면 예시 (개인정보 마스킹 처리됨)',
    },
    {
      id: uuidv4(), fileName: '[체크리스트] 지급명령 필수기재사항 점검표.xlsx', fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileSize: 35000,
      scope: 'common', tag: '체크리스트', reliability: '원본 확인됨', group: '법리자료',
      uploadedAt: '2025-06-15T09:00:00Z', ocrStatus: 'none', isKeyDocument: false, isCitedInDraft: false, excludeFromAI: false,
      commonTarget: '지급명령', description: '지급명령 신청 전 필수 확인 항목 체크리스트',
    },
    {
      id: uuidv4(), fileName: '[이론] 민사보전법 핵심 정리.pdf', fileType: 'application/pdf', fileSize: 1500000,
      scope: 'common', tag: '이론자료', reliability: '원본 확인됨', group: '법리자료',
      uploadedAt: '2025-05-20T09:00:00Z', ocrStatus: 'none', isKeyDocument: false, isCitedInDraft: false, excludeFromAI: false,
      commonTarget: '전체', description: '가압류·가처분 관련 민사보전법 요건 및 판례 정리',
    },
  ];
}

// ===== 데모용 사건별 자료 =====
function createDemoCaseFiles(): UploadedFile[] {
  return [
    {
      id: uuidv4(), fileName: '금전소비대차계약서_20240315.pdf', fileType: 'application/pdf', fileSize: 1200000,
      scope: 'case', tag: '계약서', reliability: '원본 확인됨', group: '신청인 자료',
      uploadedAt: now(), ocrStatus: 'none', isKeyDocument: true, isCitedInDraft: true, excludeFromAI: false,
      content: '채권자 주식회사 인콘과 채무자 ABC무역 김철수 간 금전소비대차계약. 대여금 5,000만원, 이자 연 5%, 변제기 2025년 3월 15일.',
    },
    {
      id: uuidv4(), fileName: '송금확인서_국민은행_20240315.pdf', fileType: 'application/pdf', fileSize: 450000,
      scope: 'case', tag: '송금내역', reliability: '원본 확인됨', group: '신청인 자료',
      uploadedAt: now(), ocrStatus: 'none', isKeyDocument: true, isCitedInDraft: true, excludeFromAI: false,
      content: '2024.03.15 주식회사 인콘 → 김철수 국민은행 계좌 50,000,000원 이체 확인',
    },
    {
      id: uuidv4(), fileName: '내용증명_독촉장_20250901.pdf', fileType: 'application/pdf', fileSize: 320000,
      scope: 'case', tag: '내용증명', reliability: '원본 확인됨', group: '신청인 자료',
      uploadedAt: now(), ocrStatus: 'none', isKeyDocument: false, isCitedInDraft: false, excludeFromAI: false,
      content: '2025.09.01 발송. 변제기 도과 통지 및 원리금 상환 촉구. 배달증명 확인됨.',
    },
    {
      id: uuidv4(), fileName: '카카오톡_대화내역_김철수.png', fileType: 'image/png', fileSize: 2800000,
      scope: 'case', tag: '문자/이메일', reliability: 'OCR 결과만 있음', group: '증빙자료',
      uploadedAt: now(), ocrStatus: 'completed', isKeyDocument: false, isCitedInDraft: false, excludeFromAI: false,
      content: '[OCR 추출] 김철수: "다음달에는 꼭 갚겠습니다" (2025.06.12) / 김철수: "조금만 더 기다려주세요" (2025.08.20)',
    },
    {
      id: uuidv4(), fileName: '사업자등록증_ABC무역.jpg', fileType: 'image/jpeg', fileSize: 1500000,
      scope: 'case', tag: '기타증빙', reliability: '일부 불명확', group: '상대방 자료',
      uploadedAt: now(), ocrStatus: 'completed', isKeyDocument: false, isCitedInDraft: false, excludeFromAI: false,
      content: '[OCR 추출] 상호: ABC무역 / 대표자: 김철수 / 사업자번호: 123-45-6●●●● (일부 불명확)',
    },
  ];
}

// 시뮬레이션용 데모 데이터 생성
function generateDemoAnalysis(caseInfo: CaseInfo, files: UploadedFile[]) {
  const procedureRecommendation: ProcedureRecommendation = {
    recommended: caseInfo.documentType,
    alternatives: caseInfo.documentType === '지급명령'
      ? ['가압류' as DocumentType]
      : ['지급명령' as DocumentType],
    reason: caseInfo.documentType === '지급명령'
      ? '금전채권이며 서류상 입증이 가능한 것으로 보여 지급명령이 적절합니다.'
      : '피보전권리의 소명과 보전 필요성이 인정될 수 있어 가압류가 적절합니다.',
    additionalQuestions: [
      '채무자가 이의를 제기할 가능성이 있는지 확인이 필요합니다.',
      '기존에 독촉이나 내용증명을 발송한 사실이 있는지 확인이 필요합니다.',
    ],
  };

  const factSummary: FactSummary = {
    parties: [
      { role: '채권자(신청인)', name: caseInfo.clientName || '[미입력]' },
      { role: '채무자(피신청인)', name: caseInfo.opponentName || '[미입력]' },
    ],
    amount: files.length > 0 ? '50,000,000원 (금전소비대차계약서 기준)' : '[업로드 자료에서 추출 필요]',
    dates: files.length > 0
      ? [
          { label: '계약일', value: '2024. 03. 15. (금전소비대차계약서)' },
          { label: '변제기', value: '2025. 03. 15. (금전소비대차계약서)' },
          { label: '송금일', value: '2024. 03. 15. (송금확인서)' },
          { label: '독촉일', value: '2025. 09. 01. (내용증명)' },
        ]
      : [
          { label: '계약일', value: '[추가확인 필요]' },
          { label: '변제기', value: '[추가확인 필요]' },
        ],
    claimCause: files.length > 0
      ? '금전소비대차 — 채권자가 2024.03.15. 채무자에게 5,000만원을 대여하였으나, 변제기(2025.03.15.) 경과 후에도 미상환'
      : '[업로드 자료 분석 후 정리 예정]',
    confirmedFacts: files.length > 0
      ? [
          '채권자(주식회사 인콘)와 채무자(김철수) 간 금전소비대차계약 체결 (근거: 금전소비대차계약서)',
          '대여금 5,000만원, 이자 연 5% (근거: 금전소비대차계약서)',
          '2024.03.15. 실제 송금 완료 (근거: 송금확인서)',
          '2025.09.01. 내용증명으로 독촉 발송 (근거: 내용증명 독촉장)',
          '채무자가 카카오톡으로 채무 인정 발언 (근거: 카카오톡 대화내역)',
        ]
      : ['아직 업로드된 자료 없음'],
    conflictingFacts: files.length > 0
      ? ['사업자등록증 OCR 결과에서 사업자번호 일부 불명확 — 원본 확인 필요']
      : [],
    unconfirmedFacts: files.length > 0
      ? [
          '채무자 현재 주소 확인 필요 (지급명령 송달용)',
          '약정이율 적용 기간 정확한 산정 필요',
          '일부 변제 여부 확인 필요',
        ]
      : [
          '정확한 청구금액 확인 필요',
          '변제기 도래 여부 확인 필요',
          '채무자 주소지 확인 필요',
        ],
  };

  const hasFiles = files.length > 0;
  const requirementCheck: RequirementCheck = {
    procedureName: caseInfo.documentType,
    requirements: caseInfo.documentType === '지급명령'
      ? [
          { name: '금전채권 여부', status: hasFiles ? '충족' : '미확인', reason: hasFiles ? '금전소비대차계약서에 의한 대여금 채권 확인' : '자료 분석 필요', evidenceDoc: hasFiles ? '금전소비대차계약서_20240315.pdf' : '-', additionalNeeded: hasFiles ? '-' : '계약서 또는 차용증' },
          { name: '이행기 도래', status: hasFiles ? '충족' : '미확인', reason: hasFiles ? '변제기 2025.03.15. 경과, 현재까지 미상환' : '변제기 확인 필요', evidenceDoc: hasFiles ? '금전소비대차계약서_20240315.pdf' : '-', additionalNeeded: hasFiles ? '-' : '계약서 내 변제기 조항' },
          { name: '금전 교부 증명', status: hasFiles ? '충족' : '부족', reason: hasFiles ? '국민은행 송금확인서로 실제 이체 확인' : '자료 미첨부', evidenceDoc: hasFiles ? '송금확인서_국민은행_20240315.pdf' : '-', additionalNeeded: hasFiles ? '-' : '송금내역, 세금계산서 등' },
          { name: '독촉 이행', status: hasFiles ? '충족' : '미확인', reason: hasFiles ? '2025.09.01. 내용증명 발송 확인' : '독촉 여부 미확인', evidenceDoc: hasFiles ? '내용증명_독촉장_20250901.pdf' : '-', additionalNeeded: hasFiles ? '-' : '내용증명 사본' },
          { name: '채무자 특정', status: caseInfo.opponentName ? '일부충족' : '부족', reason: caseInfo.opponentName ? '성명 확인, 주민등록번호 미확인' : '상대방명 미입력', evidenceDoc: hasFiles ? '사업자등록증_ABC무역.jpg (일부 불명확)' : '-', additionalNeeded: '주민등록번호 또는 정확한 사업자등록번호' },
        ]
      : [
          { name: '피보전권리 소명', status: '미확인', reason: '자료 분석 필요', evidenceDoc: '-', additionalNeeded: '채권 발생 근거 자료' },
          { name: '보전 필요성', status: '미확인', reason: '채무자 재산상태 확인 필요', evidenceDoc: '-', additionalNeeded: '재산조회 결과, 채무자 상태 관련 자료' },
          { name: '목적물 특정', status: '부족', reason: '가압류 대상 미특정', evidenceDoc: '-', additionalNeeded: '부동산등기부등본 또는 예금정보' },
        ],
    keyPoints: hasFiles
      ? [
          '대여금 5,000만원의 교부 경위 상세 기재',
          '변제기 도래 사실 및 독촉 경위 기재',
          '약정이자 산정 근거 명시',
          '채무자의 채무 인정 사실 (카카오톡) 활용 여부 검토',
        ]
      : [
          '청구원인 사실의 구체적 기재',
          '증빙서류와 청구금액의 일치 여부',
        ],
    risks: hasFiles
      ? [
          '사업자등록증 OCR 일부 불명확 — 채무자 특정 보완 필요',
          '일부 변제 여부 미확인 시 청구금액 정합성 문제 가능',
        ]
      : [
          '자료 부족으로 요건 충족 여부 판단 유보',
        ],
  };

  return { procedureRecommendation, factSummary, requirementCheck };
}

function generateDemoParagraphs(caseInfo: CaseInfo): Paragraph[] {
  if (caseInfo.documentType === '지급명령') {
    return [
      {
        id: uuidv4(), content: '지급명령신청서', status: '초안',
        source: 'ai', isLocked: false, references: [], citations: [], comments: [],
      },
      {
        id: uuidv4(), content: `채권자: ${caseInfo.clientName || '[채권자명]'}\n주소: [주소 기재]\n전화번호: [전화번호]`, status: '검토 필요',
        source: 'ai', isLocked: false, references: [], citations: [], comments: [],
      },
      {
        id: uuidv4(), content: `채무자: ${caseInfo.opponentName || '[채무자명]'}\n주소: [주소 기재]`, status: '검토 필요',
        source: 'ai', isLocked: false, references: [], citations: [], comments: [],
      },
      {
        id: uuidv4(), content: '청구취지\n\n채무자는 채권자에게 금 [금액]원 및 이에 대하여 [기산일]부터 이 사건 지급명령 정본 송달일까지는 연 [약정이율]%의, 그 다음날부터 다 갚는 날까지는 연 12%의 각 비율에 의한 금원을 지급하라.\n라는 명령을 구합니다.', status: '초안',
        source: 'ai', isLocked: false, references: [], citations: [
          { id: uuidv4(), type: '법조문', reference: '민사소송법 제462조', verified: null, relevance: '지급명령 근거 조문' },
        ], comments: [],
      },
      {
        id: uuidv4(), content: '청구원인\n\n1. 당사자 관계\n[추가확인 필요 - 당사자 간 관계 및 거래 경위를 기재해 주세요]\n\n2. 채권발생 원인\n[추가확인 필요 - 계약 내용, 대여금 등 채권 발생 원인을 구체적으로 기재해 주세요]\n\n3. 변제기 도래 및 미이행\n[추가확인 필요 - 변제기와 채무자의 미이행 사실을 기재해 주세요]\n\n4. 결론\n따라서 채무자는 채권자에게 위 금원을 지급할 의무가 있으므로, 이 사건 지급명령을 구합니다.', status: '초안',
        source: 'ai', isLocked: false, references: [], citations: [], comments: ['[추가확인 필요] 표시된 부분은 자료 업로드 후 보완 필요'],
      },
      {
        id: uuidv4(), content: '첨부서류\n\n1. [계약서 / 차용증 사본 1통]\n2. [송금내역서 1통]\n3. [내용증명 사본 1통]\n\n[추가확인 필요 - 실제 첨부 가능한 서류 목록으로 수정 필요]', status: '초안',
        source: 'ai', isLocked: false, references: [], citations: [], comments: [],
      },
    ];
  }
  // 가압류/가처분 기본 초안
  return [
    {
      id: uuidv4(), content: `${caseInfo.subDocumentType} 신청서`, status: '초안',
      source: 'ai', isLocked: false, references: [], citations: [], comments: [],
    },
    {
      id: uuidv4(), content: `채권자(신청인): ${caseInfo.clientName || '[신청인명]'}\n채무자(피신청인): ${caseInfo.opponentName || '[피신청인명]'}`, status: '검토 필요',
      source: 'ai', isLocked: false, references: [], citations: [], comments: [],
    },
    {
      id: uuidv4(), content: '신청취지\n\n[추가확인 필요 - 구체적인 신청취지를 자료 분석 후 작성합니다]', status: '초안',
      source: 'ai', isLocked: false, references: [], citations: [], comments: [],
    },
    {
      id: uuidv4(), content: '신청이유\n\n1. 피보전권리\n[추가확인 필요]\n\n2. 보전의 필요성\n[추가확인 필요]', status: '초안',
      source: 'ai', isLocked: false, references: [], citations: [], comments: [],
    },
  ];
}

export const useStore = create<AppState>((set, get) => ({
  // === 사건 목록 ===
  cases: [],
  currentCaseId: null,

  createCase: (data) => {
    const newCase: CaseInfo = {
      id: uuidv4(),
      caseName: data.caseName || '새 사건',
      clientName: data.clientName || '',
      opponentName: data.opponentName || '',
      documentType: data.documentType || '지급명령',
      subDocumentType: data.subDocumentType || '일반',
      status: '자료수집 중',
      createdAt: now(),
      updatedAt: now(),
    };
    set((state) => ({
      cases: [...state.cases, newCase],
      currentCaseId: newCase.id,
      showCaseModal: false,
      paragraphs: [],
      files: createDemoCaseFiles(), // 데모 사건별 자료 자동 추가
      commonFiles: state.commonFiles.length > 0 ? state.commonFiles : createInitialCommonFiles(), // 공통자료가 없으면 초기화
      versions: [],
      chatMessages: [],
      procedureRecommendation: null,
      factSummary: null,
      requirementCheck: null,
      citationVerifications: [],
      supplementRequests: [],
      unclearItems: [],
      riskWarnings: [],
      executionLogs: [],
      feasibility: null,
    }));
  },

  selectCase: (id) => set({ currentCaseId: id }),

  updateCaseStatus: (status) => {
    set((state) => ({
      cases: state.cases.map((c) =>
        c.id === state.currentCaseId ? { ...c, status, updatedAt: now() } : c
      ),
    }));
  },

  // === 사건별 자료 ===
  files: [],

  addFile: (file) => {
    const newFile: UploadedFile = {
      id: uuidv4(),
      fileName: file.fileName || '새 파일',
      fileType: file.fileType || 'application/pdf',
      fileSize: file.fileSize || 0,
      scope: file.scope || 'case',
      tag: file.tag || '기타증빙',
      reliability: file.reliability || '원본 확인됨',
      group: file.group || '신청인 자료',
      uploadedAt: now(),
      ocrStatus: 'none',
      isKeyDocument: false,
      isCitedInDraft: false,
      excludeFromAI: false,
      content: file.content,
    };
    set((state) => ({ files: [...state.files, newFile] }));
  },

  toggleKeyDocument: (id) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, isKeyDocument: !f.isKeyDocument } : f
      ),
    }));
  },

  removeFile: (id) => {
    set((state) => ({ files: state.files.filter((f) => f.id !== id) }));
  },

  updateFileTag: (id, tag) => {
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, tag } : f)),
    }));
  },

  // === 공통자료 ===
  commonFiles: createInitialCommonFiles(),

  addCommonFile: (file) => {
    const newFile: UploadedFile = {
      id: uuidv4(),
      fileName: file.fileName || '새 공통자료',
      fileType: file.fileType || 'application/pdf',
      fileSize: file.fileSize || 0,
      scope: 'common',
      tag: file.tag || '업무지침',
      reliability: file.reliability || '원본 확인됨',
      group: '법리자료',
      uploadedAt: now(),
      ocrStatus: 'none',
      isKeyDocument: false,
      isCitedInDraft: false,
      excludeFromAI: false,
      content: file.content,
      commonTarget: (file as UploadedFile).commonTarget || '전체',
      description: (file as UploadedFile).description || '',
    };
    set((state) => ({ commonFiles: [...state.commonFiles, newFile] }));
  },

  removeCommonFile: (id) => {
    set((state) => ({ commonFiles: state.commonFiles.filter((f) => f.id !== id) }));
  },

  // === 문서 편집 ===
  paragraphs: [],
  setParagraphs: (paragraphs) => set({ paragraphs }),

  updateParagraph: (id, content) => {
    set((state) => ({
      paragraphs: state.paragraphs.map((p) =>
        p.id === id ? { ...p, content, source: 'human' as const, status: '수정 완료' as const } : p
      ),
    }));
  },

  lockParagraph: (id) => {
    set((state) => ({
      paragraphs: state.paragraphs.map((p) =>
        p.id === id ? { ...p, isLocked: !p.isLocked } : p
      ),
    }));
  },

  setParagraphStatus: (id, status) => {
    set((state) => ({
      paragraphs: state.paragraphs.map((p) =>
        p.id === id ? { ...p, status } : p
      ),
    }));
  },

  // === 버전 관리 ===
  versions: [],
  currentVersionId: null,

  saveVersion: (name, description) => {
    const { paragraphs } = get();
    const version: DocumentVersion = {
      id: uuidv4(),
      versionName: name,
      description,
      paragraphs: JSON.parse(JSON.stringify(paragraphs)),
      createdAt: now(),
      createdBy: 'user',
    };
    set((state) => ({
      versions: [...state.versions, version],
      currentVersionId: version.id,
    }));
  },

  restoreVersion: (id) => {
    const { versions } = get();
    const version = versions.find((v) => v.id === id);
    if (version) {
      set({ paragraphs: JSON.parse(JSON.stringify(version.paragraphs)), currentVersionId: id });
    }
  },

  // === AI 패널 ===
  activeAITab: '절차추천',
  setActiveAITab: (tab) => set({ activeAITab: tab }),

  // === AI 분석 결과 ===
  procedureRecommendation: null,
  factSummary: null,
  requirementCheck: null,
  citationVerifications: [],
  supplementRequests: [],
  unclearItems: [],
  riskWarnings: [],
  executionLogs: [],
  feasibility: null,

  // === 에이전트 실행 ===
  isAgentRunning: false,

  runAgentPipeline: async () => {
    const { cases, currentCaseId, files } = get();
    const currentCase = cases.find((c) => c.id === currentCaseId);
    if (!currentCase) return;

    set({ isAgentRunning: true, executionLogs: [] });

    const addLog = (agentName: string, action: string, status: 'running' | 'success' | 'failed') => {
      set((state) => ({
        executionLogs: [...state.executionLogs, {
          id: uuidv4(), agentName, action,
          usedDocuments: files.map((f) => f.fileName),
          status, timestamp: now(),
        }],
      }));
    };

    // 1단계: 문서분류·절차선정
    addLog('문서분류·절차선정 에이전트', '절차 분류 및 추천 실행', 'running');
    await delay(1500);
    const analysis = generateDemoAnalysis(currentCase, files);
    set({
      procedureRecommendation: analysis.procedureRecommendation,
    });
    addLog('문서분류·절차선정 에이전트', '절차 추천 완료', 'success');
    set((state) => ({ cases: state.cases.map(c => c.id === currentCaseId ? { ...c, status: '사실관계 정리 중' } : c) }));

    // 2단계: 사실관계 추출
    addLog('사실관계 추출 에이전트', '사실관계 추출 실행', 'running');
    await delay(1500);
    set({ factSummary: analysis.factSummary });
    addLog('사실관계 추출 에이전트', '사실관계 추출 완료', 'success');
    set((state) => ({ cases: state.cases.map(c => c.id === currentCaseId ? { ...c, status: '요건검토 중' } : c) }));

    // 3단계: 요건점검
    addLog('요건점검 에이전트', '요건 점검 실행', 'running');
    await delay(1500);
    set({ requirementCheck: analysis.requirementCheck });
    addLog('요건점검 에이전트', '요건 점검 완료', 'success');

    // 4단계: 초안작성
    addLog('초안작성 에이전트', '초안 작성 실행', 'running');
    await delay(2000);
    const demoParagraphs = generateDemoParagraphs(currentCase);
    set({
      paragraphs: demoParagraphs,
      feasibility: files.length > 0 ? '보완 후 진행 가능' : '현재 자료만으로는 권고 어려움',
    });
    addLog('초안작성 에이전트', '초안 작성 완료', 'success');
    set((state) => ({ cases: state.cases.map(c => c.id === currentCaseId ? { ...c, status: '검증 중' } : c) }));

    // 5단계: 판례·인용 검증
    addLog('판례·인용 검증 에이전트', '인용 검증 실행', 'running');
    await delay(1500);
    set({
      citationVerifications: [
        { item: '민사소송법 제462조', type: '법조문', exists: true, source: '국가법령정보센터', relevance: '지급명령 근거 조문', note: '현행 유효' },
      ],
      supplementRequests: [
        { id: uuidv4(), description: '송금내역서 또는 이체확인서', reason: '청구금액의 실제 지급 여부 확인 필요', example: '은행 이체확인서, 무통장입금 확인서', status: '대기중' },
        { id: uuidv4(), description: '채무자 주소 확인 자료', reason: '지급명령 송달을 위한 주소 특정 필요', example: '주민등록초본, 법인등기부등본', status: '대기중' },
      ],
      unclearItems: [
        { id: uuidv4(), description: '정확한 청구금액이 특정되지 않았습니다', reason: '계약서 또는 차용증에서 금액 확인 필요', status: '대기중' },
        { id: uuidv4(), description: '변제기 도래 여부가 확인되지 않았습니다', reason: '계약서 내 변제기 조항 확인 필요', status: '대기중' },
      ],
    });
    addLog('판례·인용 검증 에이전트', '인용 검증 완료', 'success');

    // 6단계: 최종검토·리스크표시
    addLog('최종검토·리스크표시 에이전트', '최종 리스크 점검 실행', 'running');
    await delay(1000);
    set({
      riskWarnings: [
        { id: uuidv4(), type: '증빙 부족', level: '높음', description: '청구금액을 뒷받침하는 증빙자료가 부족합니다', suggestion: '계약서, 송금내역, 세금계산서 등 금액 관련 증빙을 업로드해 주세요' },
        { id: uuidv4(), type: '요건 부족', level: '중간', description: '변제기 도래 여부가 확인되지 않았습니다', suggestion: '계약서 내 변제기 조항 또는 독촉 내역을 확인해 주세요' },
      ],
    });
    addLog('최종검토·리스크표시 에이전트', '최종 리스크 점검 완료', 'success');
    set((state) => ({
      cases: state.cases.map(c => c.id === currentCaseId ? { ...c, status: '최종검토 중' } : c),
      isAgentRunning: false,
    }));
  },

  runSingleAgent: async (agentName: string) => {
    set({ isAgentRunning: true });
    set((state) => ({
      executionLogs: [...state.executionLogs, {
        id: uuidv4(), agentName, action: `${agentName} 재실행`,
        usedDocuments: state.files.map((f) => f.fileName),
        status: 'running' as const, timestamp: now(),
      }],
    }));
    await delay(2000);
    set((state) => ({
      executionLogs: [...state.executionLogs, {
        id: uuidv4(), agentName, action: `${agentName} 재실행 완료`,
        usedDocuments: state.files.map((f) => f.fileName),
        status: 'success' as const, timestamp: now(),
      }],
      isAgentRunning: false,
    }));
  },

  // === 대화형 인터페이스 ===
  chatMessages: [],
  addChatMessage: (role, content) => {
    set((state) => ({
      chatMessages: [...state.chatMessages, {
        id: uuidv4(), role, content, timestamp: now(),
        actions: role === 'ai' ? [
          { label: '문서에 반영', type: 'reflect_to_doc' },
          { label: '검증 실행', type: 'run_verification' },
        ] : undefined,
      }],
    }));
  },

  // === UI 상태 ===
  showCaseModal: false,
  setShowCaseModal: (show) => set({ showCaseModal: show }),
  selectedParagraphId: null,
  setSelectedParagraphId: (id) => set({ selectedParagraphId: id }),
  leftSidebarTab: 'cases',
  setLeftSidebarTab: (tab) => set({ leftSidebarTab: tab }),
}));

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
