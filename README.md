이 시스템은 무엇인가요?
법무사님이 지급명령, 가압류, 가처분 등의 법률문서를 작성할 때, AI가 자료 분석부터 초안 작성, 판례 검증까지 자동으로 도와주는 업무 보조 시스템입니다.

핵심 컨셉은 "법무사님은 자료를 올리고 판단만 하면, AI가 나머지 반복 작업을 처리한다" 입니다.

법무사님이 하실 일 (실제 사용 흐름)
1단계: 사건 등록

왼쪽 상단 "+ 새 사건 생성" 버튼 클릭
사건명(예: "홍길동 대여금 반환 청구"), 의뢰인명, 상대방명 입력
문서유형(지급명령/가압류/가처분) 선택
각 유형별로 어떤 상황에 적합한지 간단한 설명이 표시됩니다
2단계: 자료 업로드

왼쪽 "자료" 탭 클릭 → 두 종류의 자료를 구분해서 올립니다:
📁 사건별 자료: 의뢰인에게 받은 이 사건 고유의 자료
예: 계약서, 차용증, 송금내역, 내용증명, 문자/카톡 캡처 등
올릴 때 태그(계약서/송금내역 등)와 분류(신청인 자료/상대방 자료 등)를 지정
📚 공통자료: 모든 사건에서 공통으로 참고하는 자료
예: 사무소 업무지침, 판례 모음집, 서면 샘플, 절차 체크리스트 등
한번 올려두면 새 사건을 만들 때마다 자동으로 적용됩니다
3단계: AI 분석 실행 (버튼 한 번)

상단의 "▶ 전체 분석 실행" 버튼을 누르면
6개의 AI 에이전트가 아래 순서대로 자동 실행됩니다 (아래에서 자세히 설명)
실행 중 진행 상태가 실시간으로 표시됩니다
4단계: 결과 확인 및 수정

가운데 영역: AI가 작성한 초안이 문단별로 표시됩니다
각 문단을 직접 수정하거나, AI에게 재작성을 요청할 수 있습니다
문단별로 "초안 / 검토 필요 / 검증 완료 / 수정 완료" 상태를 지정할 수 있습니다
마음에 드는 문단은 "잠금"하면 AI가 수정하지 않습니다
오른쪽 패널: AI의 분석 결과를 8개 탭으로 확인합니다 (아래에서 자세히 설명)
5단계: 버전 저장

수정이 끝나면 "버전 저장"으로 현재 상태를 저장
나중에 이전 버전으로 돌아갈 수 있습니다




This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
