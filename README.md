# POB - 도마뱀 개체관리 시스템

도마뱀 샵 및 브리더를 위한 개체관리 솔루션

## 🦎 About

도마뱀 샵이나 판매 목적으로 자택에서 다량의 도마뱀을 키우는 사람을 대상으로 하는 **B2B 납품형 SaaS** 솔루션입니다.

### 주요 기능

- ✅ **사용자 관리** - 이메일 가입 신청 + 관리자 승인 시스템
- ✅ **다중 테넌시** - 고객사(샵)별 데이터 격리
- ✅ **역할 기반 권한** - Admin(시스템 관리자) / Client(샵 고객)
- 🚧 **개체 관리** - 도마뱀 개체 등록 및 관리 (준비 중)
- 🚧 **브리딩 관리** - 교배 및 번식 기록 (준비 중)

## 🚀 Tech Stack

- **Framework**: Next.js 15.5.6 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Auth**: Supabase Auth
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (New York variant)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Icons**: Lucide React
- **React**: 19.1.0 with Server Components

## 📋 Project Conventions

**핵심 원칙:**
1. **Server Actions First (95%)** - 모든 데이터 작업은 Server Actions 사용
2. **API Routes (5%)** - Webhook 전용으로만 사용
3. **shadcn/ui First** - 모든 UI 컴포넌트는 shadcn/ui 우선 사용

자세한 내용은 [CONVENTIONS.md](./CONVENTIONS.md)를 참고하세요.

## 🏗️ Project Structure

```
src/
├── actions/              # Server Actions (얇은 레이어 - Validation, Auth)
│   ├── auth/            # 인증 관련 Actions
│   ├── users/           # 사용자 관리 Actions
│   └── tenants/         # 테넌트 관리 Actions
├── services/            # Business Logic Layer (MANDATORY!)
│   ├── auth-service.ts  # 인증 비즈니스 로직
│   ├── user-service.ts  # 사용자 관리 로직
│   └── tenant-service.ts # 테넌트 관리 로직
├── app/                 # Next.js App Router
│   ├── (auth)/          # 인증 페이지 (로그인, 회원가입)
│   ├── (admin)/         # 관리자 페이지
│   ├── (client)/        # 클라이언트 페이지
│   └── page.tsx         # Root (로그인 리다이렉트)
├── components/          # Shared components
│   └── ui/              # shadcn/ui components
└── lib/                 # Utilities & configurations
    ├── prisma.ts        # Prisma client
    ├── r2.ts            # R2 storage
    └── supabase/        # Supabase clients
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- Supabase 프로젝트 (Auth + PostgreSQL)
- Cloudflare R2 bucket (선택사항)

### Environment Variables

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/database?schema=public&pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/database?schema=public"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Cloudflare R2 (Optional - for file uploads)
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="your-bucket-name"
R2_PUBLIC_URL="https://your-bucket.r2.dev"
```

`.env.example` 파일을 참고하세요.

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate:dev

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

서버가 실행되면 [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 📝 Development Commands

```bash
# Development
npm run dev                # Start dev server with Turbopack
npm run build              # Build for production
npm run start              # Start production server

# Database
npm run db:migrate:dev     # Run database migrations
npm run db:push            # Push schema changes (dev only)
npm run db:studio          # Open Prisma Studio
npm run seed               # Seed database

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint errors
npm run format             # Format with Prettier
npm run format:check       # Check Prettier formatting
```

## 🎨 Adding UI Components

이 프로젝트는 [shadcn/ui](https://ui.shadcn.com)를 사용합니다.

```bash
# 컴포넌트 추가
npx shadcn@latest add button
npx shadcn@latest add input card dialog

# 여러 컴포넌트 동시 추가
npx shadcn@latest add button input card
```

**중요:** 새로운 UI 컴포넌트를 직접 만들기 전에 항상 shadcn/ui에 있는지 확인하세요!

사용 가능한 컴포넌트: https://ui.shadcn.com/docs/components

## 🤖 AI-Assisted Development

이 프로젝트는 AI 코딩 어시스턴트와 함께 사용하도록 최적화되어 있습니다.

- **[AI_PROMPTING.md](./AI_PROMPTING.md)** - AI 사용 가이드
- **[CONVENTIONS.md](./CONVENTIONS.md)** - 프로젝트 컨벤션
- **[TEMPLATES.md](./TEMPLATES.md)** - 코드 템플릿

### Claude Code 슬래시 커맨드

```bash
/action      # Server Action 생성
/component   # React 컴포넌트 생성
/crud        # CRUD 전체 생성
/review      # 코드 리뷰
```

## 📚 Documentation

- [CONVENTIONS.md](./CONVENTIONS.md) - 프로젝트 컨벤션 및 아키텍처 결정사항
- [AI_PROMPTING.md](./AI_PROMPTING.md) - AI 어시스턴트 사용 가이드
- [TEMPLATES.md](./TEMPLATES.md) - 코드 템플릿 및 생성 패턴

## 🔗 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)

## 📄 License

This project is proprietary and confidential.
