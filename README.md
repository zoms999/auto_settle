# Auto Settle

이 프로젝트는 [Next.js](https://nextjs.org)를 사용하여 [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)으로 부트스트랩되었습니다.

## 프로젝트 기획 및 설계

### 프로젝트 개요

**Auto Settle**은 계약(Deal) 정보를 관리하고, 관련된 정산 내역을 자동화하기 위한 웹 애플리케이션입니다. 사용자는 계약을 등록, 조회, 수정, 삭제할 수 있으며, 각 계약에 따른 지급 일정 및 관련 서비스 내역을 체계적으로 관리할 수 있습니다.

### 주요 기능

*   **사용자 인증:** NextAuth.js를 활용하여 안전한 회원가입 및 로그인 기능을 제공합니다.
*   **계약 관리 (CRUD):**
    *   새로운 계약 정보를 등록합니다. (추가)
    *   전체 계약 목록을 그리드 형태로 조회합니다. (조회)
    *   각 계약의 상세 정보를 확인하고 수정합니다. (수정)
    *   불필요한 계약 정보를 삭제합니다. (삭제)
*   **대시보드:** 등록된 계약 정보를 시각적으로 명확하게 파악할 수 있는 메인 페이지를 제공합니다.
*   **API 서버:** Next.js API Routes를 사용하여 프론트엔드와 데이터를 주고받는 RESTful API를 구축합니다.

### 기술 스택

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Database:** Prisma ORM을 사용 (데이터베이스 종류는 `schema.prisma` 파일에 정의)
*   **Authentication:** NextAuth.js
*   **Styling:** Tailwind CSS

## 시작하기

먼저, 개발 서버를 실행하세요:

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
# 또는
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

`app/page.tsx` 파일을 수정하여 페이지를 편집할 수 있습니다. 파일을 편집하면 페이지가 자동으로 업데이트됩니다.

이 프로젝트는 [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)를 사용하여 Vercel의 새로운 글꼴 제품군인 [Geist](https://vercel.com/font)를 자동으로 최적화하고 로드합니다.

## 더 알아보기

Next.js에 대해 더 자세히 알아보려면 다음 리소스를 살펴보세요:

- [Next.js 문서](https://nextjs.org/docs) - Next.js 기능 및 API에 대해 알아보세요.
- [Next.js 배우기](https://nextjs.org/learn) - 대화형 Next.js 튜토리얼입니다.

[Next.js GitHub 저장소](https://github.com/vercel/next.js)를 확인해 보세요 - 여러분의 피드백과 기여를 환영합니다!

## Vercel에 배포하기

Next.js 앱을 배포하는 가장 쉬운 방법은 Next.js 제작자가 만든 [Vercel 플랫폼](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)을 사용하는 것입니다.

자세한 내용은 [Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)를 확인하세요.
