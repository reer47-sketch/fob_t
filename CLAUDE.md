# FOBreeders — Claude Code 가이드

파충류 브리더 전문 SaaS 관리 시스템입니다.

- 기술 스택: Next.js 14 App Router, TypeScript, Prisma, Supabase, Tailwind CSS, Vercel
- 배포: fob-t.vercel.app
- 저장소 브랜치: master (main 브랜치)

---

## 자동 업데이트 규칙

**기능 추가 또는 수정이 완료될 때마다 반드시 `docs/agents.md`의 규칙을 따라 문서를 업데이트하세요.**

자세한 내용 → [docs/agents.md](docs/agents.md)

요약:
1. `docs/support.md` — AI 어시스턴트 프롬프트 최신화
2. `src/app/(client)/(desktop)/help/page.tsx` — 사용자 도움말 최신화
3. Notion 업데이트 로그 페이지에 변경 내용 추가

---

## 주요 파일 위치

| 역할 | 경로 |
|---|---|
| AI 프롬프트 | `docs/support.md` |
| 도움말 페이지 | `src/app/(client)/(desktop)/help/page.tsx` |
| AI 도우미 컴포넌트 | `src/components/ai-assistant/ai-assistant.tsx` |
| AI 채팅 API | `src/app/api/assistant/chat/route.ts` |
| 브리딩 캘린더 | `src/components/calendar/calendar-view.tsx` |
| 주간 리포트 시트 | `src/components/calendar/weekly-report-sheet.tsx` |
| 주간 리포트 PDF 페이지 | `src/app/weekly-report/page.tsx` |
| 구글 캘린더 동기화 | `src/actions/calendar/google-calendar.ts` |
| 자동 업데이트 규칙 | `docs/agents.md` |

---

## 개발 주의사항

- Next.js App Router: 서버 컴포넌트에서 `onClick` 등 이벤트 핸들러 사용 불가 → 클라이언트 컴포넌트로 분리
- Supabase 인증: 서버에서는 `createClient()`(`@/lib/supabase/server`) 사용
- Google Calendar 이벤트 ID: base32hex(0-9, a-v)만 허용 → prefix+id 모두 hex 인코딩
- `redirect()` from `next/navigation`은 try/catch 내에서 사용 불가 → Route Handler에서는 `NextResponse.redirect()` 사용
- Prisma tenantId 격리: 모든 DB 쿼리에 tenantId 조건 필수
