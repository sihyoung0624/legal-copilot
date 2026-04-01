// ===== 사건/프로젝트 기본정보 =====
export type DocumentType = '지급명령' | '가압류' | '가처분' | '기타';
export type SubDocumentType =
  | '채권가압류'
  | '부동산가압류'
  | '처분금지가처분'
  | '점유이전금지가처분'
  | '일반';

export type CaseStatus =
  | '자료수집 중'
  | '사실관계 정리 중'
  | '요건검토 중'
  | '초안작성 중'
  | '검증 중'
  | '최종검토 중';

export interface CaseInfo {
  id: string;
  caseName: string;
  clientName: string;
  opponentName: string;
  documentType: DocumentType;
  subDocumentType: SubDocumentType;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
}

// ===== 자료 업로드 =====

// 자료 범위: 사건별 vs 공통
export type FileScope = 'case' | 'common';

// 사건별 자료 태그
export type CaseFileTag =
  | '계약서'
  | '차용증'
  | '송금내역'
  | '내용증명'
  | '세금계산서'
  | '문자/이메일'
  | '등기부등본'
  | '스캔문서'
  | '내부메모'
  | '기타증빙';

// 공통자료 태그
export type CommonFileTag =
  | '업무지침'
  | '내부매뉴얼'
  | '기본판례'
  | '유권해석'
  | '이론자료'
  | '샘플서면'
  | '절차템플릿'
  | '체크리스트';

export type FileTag = CaseFileTag | CommonFileTag;

export type FileReliability =
  | '원본 확인됨'
  | 'OCR 결과만 있음'
  | '일부 불명확'
  | '재확인 필요';

export type FileGroup = '신청인 자료' | '상대방 자료' | '법리자료' | '증빙자료';

// 공통자료 적용 대상
export type CommonFileTarget = '전체' | '지급명령' | '가압류' | '가처분';

export interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  scope: FileScope;
  tag: FileTag;
  reliability: FileReliability;
  group: FileGroup;
  uploadedAt: string;
  ocrStatus: 'none' | 'processing' | 'completed' | 'failed';
  isKeyDocument: boolean;
  isCitedInDraft: boolean;
  excludeFromAI: boolean;
  content?: string;
  // 공통자료 전용 필드
  commonTarget?: CommonFileTarget;
  description?: string;
}

// ===== 문서 편집 =====
export type ParagraphStatus = '초안' | '검토 필요' | '검증 완료' | '수정 완료';
export type ParagraphSource = 'ai' | 'human';

export interface Paragraph {
  id: string;
  content: string;
  status: ParagraphStatus;
  source: ParagraphSource;
  isLocked: boolean;
  references: string[]; // 근거 자료 ID
  citations: Citation[];
  comments: string[];
}

export interface Citation {
  id: string;
  type: '판례' | '법조문' | '유권해석' | '이론';
  reference: string;
  verified: boolean | null; // null = 미검증
  relevance?: string;
}

export interface DocumentVersion {
  id: string;
  versionName: string;
  description: string;
  paragraphs: Paragraph[];
  createdAt: string;
  createdBy: 'user' | 'ai';
}

// ===== AI 피드백 =====
export type RequirementStatus = '충족' | '일부충족' | '부족' | '미확인';
export type RiskLevel = '높음' | '중간' | '낮음';
export type FeasibilityLevel =
  | '진행 가능성이 높음'
  | '보완 후 진행 가능'
  | '법률적 쟁점 큼'
  | '현재 자료만으로는 권고 어려움';

export interface ProcedureRecommendation {
  recommended: DocumentType;
  alternatives: DocumentType[];
  reason: string;
  additionalQuestions: string[];
}

export interface FactSummary {
  parties: { role: string; name: string }[];
  amount: string;
  dates: { label: string; value: string }[];
  claimCause: string;
  confirmedFacts: string[];
  conflictingFacts: string[];
  unconfirmedFacts: string[];
}

export interface RequirementCheck {
  procedureName: string;
  requirements: {
    name: string;
    status: RequirementStatus;
    reason: string;
    evidenceDoc: string;
    additionalNeeded: string;
  }[];
  keyPoints: string[];
  risks: string[];
}

export interface CitationVerification {
  item: string;
  type: '판례' | '법조문' | '유권해석' | '이론';
  exists: boolean | null;
  source: string;
  relevance: string;
  note: string;
  url?: string;
  isLiveVerified?: boolean;
}

// ===== 실시간 법령/판례 데이터 =====
export interface LiveLawArticle {
  lawName: string;
  articleNumber: string;
  articleTitle: string;
  articleContent: string;
}

export interface LivePrecedent {
  id: string;
  caseName: string;
  caseNumber: string;
  courtName: string;
  judgmentDate: string;
  judgmentType: string;
}

export interface SupplementRequest {
  id: string;
  description: string;
  reason: string;
  example: string;
  status: '대기중' | '사용자 응답 완료' | '재검증 완료' | '보류';
  userResponse?: string;
}

export interface UnclearItem {
  id: string;
  description: string;
  reason: string;
  status: '대기중' | '사용자 응답 완료' | '재검증 완료' | '보류';
  userResponse?: string;
}

export interface RiskWarning {
  id: string;
  type: '요건 부족' | '증빙 부족' | '절차 부적합' | '금액/날짜 충돌' | '인용 불안정' | '허위 인용 의심';
  level: RiskLevel;
  description: string;
  suggestion: string;
}

export interface ExecutionLog {
  id: string;
  agentName: string;
  action: string;
  usedDocuments: string[];
  status: 'success' | 'failed' | 'running';
  timestamp: string;
}

// ===== AI 패널 탭 =====
export type AITabType =
  | '절차추천'
  | '사실관계'
  | '요건점검'
  | '판례법령'
  | '추가자료'
  | '불명확항목'
  | '리스크'
  | '실행로그';

// ===== 대화형 인터페이스 =====
export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  actions?: ChatAction[];
}

export interface ChatAction {
  label: string;
  type: 'reflect_to_doc' | 'run_verification' | 'request_material';
}
