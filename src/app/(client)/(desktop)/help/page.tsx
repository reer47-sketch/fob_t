import {
  PawPrint, UtensilsCrossed, Heart, Egg, Users, BarChart3,
  QrCode, FileText, Bot, ChevronRight, AlertCircle, Lightbulb,
  RotateCcw, CheckCircle2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'

const SECTIONS = [
  { id: 'animals',    icon: PawPrint,          label: '개체 관리' },
  { id: 'feeding',    icon: UtensilsCrossed,   label: '피딩 기록' },
  { id: 'mating',     icon: Heart,             label: '메이팅 관리' },
  { id: 'incubation', icon: Egg,               label: '알 관리' },
  { id: 'customers',  icon: Users,             label: '고객 관리' },
  { id: 'sales',      icon: BarChart3,         label: '판매이력' },
  { id: 'qr',         icon: QrCode,            label: 'QR 스캔' },
  { id: 'transfer',   icon: FileText,          label: '양수양도 신고서' },
  { id: 'ai',         icon: Bot,               label: 'AI 음성 도우미' },
]

function SectionAnchor({ id }: { id: string }) {
  return <div id={id} className="-mt-20 pt-20" />
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-foreground">
      <Lightbulb className="size-4 text-primary shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  )
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      <AlertCircle className="size-4 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
        {n}
      </span>
      <p className="text-sm text-muted-foreground pt-0.5">{children}</p>
    </div>
  )
}

export default function HelpPage() {
  return (
    <div className="flex gap-8 max-w-5xl mx-auto px-6 py-8">

      {/* 좌측 고정 네비게이션 */}
      <aside className="hidden lg:block w-48 shrink-0">
        <div className="sticky top-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">목차</p>
          <nav className="flex flex-col gap-1">
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <s.icon className="size-3.5" />
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* 본문 */}
      <main className="flex-1 min-w-0 space-y-12">

        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">사용자 매뉴얼</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            FOB(포브)의 모든 기능을 한 곳에서 확인하세요.
          </p>
        </div>

        {/* ── 개체 관리 ── */}
        <section>
          <SectionAnchor id="animals" />
          <div className="flex items-center gap-2 mb-4">
            <PawPrint className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">개체 관리</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            보유 중인 파충류 개체를 등록하고 관리합니다.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            {[
              { title: '개체 등록', desc: '종·성별·모프·해칭 여부 등 상세 정보 입력' },
              { title: '수정 / 삭제', desc: '개체 상세 페이지에서 정보 수정 및 삭제' },
              { title: 'QR 코드 자동 생성', desc: '등록된 개체마다 고유 QR 코드 자동 발급' },
            ].map(c => (
              <Card key={c.title} className="border-border">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    {c.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="register">
              <AccordionTrigger className="text-sm">개체 등록 방법</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <Step n={1}>사이드바에서 <strong>개체 관리</strong>를 클릭합니다.</Step>
                <Step n={2}>우측 상단 <strong>개체 등록</strong> 버튼을 클릭합니다.</Step>
                <Step n={3}>종, 성별, 해칭/입양 여부, 모프, 이름 등을 입력합니다.</Step>
                <Step n={4}><strong>저장</strong>을 누르면 고유 ID와 QR 코드가 자동 생성됩니다.</Step>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ── 피딩 기록 ── */}
        <section>
          <SectionAnchor id="feeding" />
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">피딩 기록</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            개체별 먹이 급여 내역을 날짜·종류·양·메모와 함께 기록합니다.
          </p>

          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">지원 먹이 종류</p>
            <div className="flex flex-wrap gap-1.5">
              {['귀뚜라미', '밀웜', '사료', '야채/과일', '쥐', '냉동병아리', '초파리', '기타'].map(f => (
                <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
              ))}
            </div>
          </div>

          <TipBox>
            <strong>슈퍼푸드</strong>를 함께 급여할 경우 피딩 기록 화면에서 <strong>슈퍼푸드 추가</strong> 버튼을 켜세요. AI 도우미에서도 "슈퍼푸드 포함해서 줬어"라고 말하면 자동 체크됩니다.
          </TipBox>

          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="feeding-calendar">
              <AccordionTrigger className="text-sm">피딩 캘린더 활용하기</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                사이드바에서 <strong>피딩 캘린더</strong>를 선택하면 월별 피딩 현황을 달력 형태로 확인할 수 있습니다. 날짜를 클릭하면 해당 일자의 급여 기록 목록이 표시됩니다.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ── 메이팅 관리 ── */}
        <section>
          <SectionAnchor id="mating" />
          <div className="flex items-center gap-2 mb-4">
            <Heart className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">메이팅 관리</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            수컷·암컷 쌍을 등록하고 메이팅 날짜·횟수를 기록합니다.
          </p>

          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">메이팅 상태</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '메이팅 대기', color: 'secondary' },
                { label: '산란 중', color: 'secondary' },
                { label: '산란 임박', color: 'secondary' },
                { label: '쿨링', color: 'secondary' },
              ].map(s => (
                <Badge key={s.label} variant="secondary" className="text-xs">{s.label}</Badge>
              ))}
            </div>
          </div>

          <Accordion type="multiple">
            <AccordionItem value="mating-basic">
              <AccordionTrigger className="text-sm">기본 메이팅 등록</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <Step n={1}>메이팅 관리 메뉴에서 <strong>새 메이팅 등록</strong>을 클릭합니다.</Step>
                <Step n={2}>암컷 개체를 선택하고, 수컷은 직접 선택하거나 <strong>QR 스캔</strong> 버튼으로 스캔합니다.</Step>
                <Step n={3}>메이팅 날짜와 횟수를 입력 후 저장합니다.</Step>
                <Step n={4}>산란 후 <strong>산란 등록</strong> 버튼으로 알 관리와 연결합니다.</Step>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="mating-seed-change">
              <AccordionTrigger className="text-sm">씨바꿈 처리 방법</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <Step n={1}>새 수컷과의 메이팅을 새로 등록합니다.</Step>
                <Step n={2}>산란 등록 시 수컷 개체를 선택할 때, 가장 최근 메이팅 수컷과 이전 수컷 <strong>모두 선택</strong>할 수 있습니다.</Step>
                <TipBox>부모 불확실 케이스를 정확히 기록하기 위해 두 수컷 모두 선택해두는 것을 권장합니다.</TipBox>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="mating-no-male">
              <AccordionTrigger className="text-sm">수컷 없이 산란 등록</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>메이팅 없이도 산란 등록이 가능합니다. 무정란이 나온 경우 산란 등록 후 상태를 <strong>메이팅 대기</strong>로 변경하세요.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ── 알 관리 ── */}
        <section>
          <SectionAnchor id="incubation" />
          <div className="flex items-center gap-2 mb-4">
            <Egg className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">알 관리</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            클러치(산란 묶음) 단위로 알을 관리하고 인큐베이터 위치(존/랙/셀)를 기록합니다.
          </p>

          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">알 상태</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '인큐 (정상)', cls: 'bg-green-100 text-green-700' },
                { label: '무정란', cls: 'bg-gray-100 text-gray-600' },
                { label: '부화', cls: 'bg-blue-100 text-blue-700' },
                { label: '실패', cls: 'bg-red-100 text-red-700' },
              ].map(s => (
                <span key={s.label} className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
              ))}
            </div>
          </div>

          <Accordion type="multiple">
            <AccordionItem value="egg-recovery">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <RotateCcw className="size-3.5 text-amber-500" />
                  실수로 상태를 잘못 눌렀을 때 복구 방법
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                <WarningBox>실패 또는 부화로 잘못 처리한 경우 아래 단계로 복구할 수 있습니다.</WarningBox>
                <Step n={1}><strong>알 관리</strong> 메뉴로 이동합니다.</Step>
                <Step n={2}>해당 클러치를 클릭합니다.</Step>
                <Step n={3}>잘못 처리된 알을 클릭합니다.</Step>
                <Step n={4}><strong>인큐로 되돌리기</strong> 버튼을 클릭합니다. 알이 인큐 상태로 복귀됩니다.</Step>
                <Step n={5}>다른 상태로 변경하려면 되돌린 후 원하는 상태로 다시 설정하세요.</Step>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="egg-hatch-register">
              <AccordionTrigger className="text-sm">부화 후 개체 바로 등록</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                알 상태를 <strong>부화</strong>로 변경하면 <strong>개체 등록</strong> 버튼이 활성화됩니다. 부모 정보·종·모프 등 기본 정보가 사전에 채워져 있어 빠르게 등록할 수 있습니다.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="egg-temp">
              <AccordionTrigger className="text-sm">온도 로그 기록</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                클러치 상세 페이지에서 날짜별 인큐베이터 온도를 기록할 수 있습니다.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ── 고객 관리 ── */}
        <section>
          <SectionAnchor id="customers" />
          <div className="flex items-center gap-2 mb-4">
            <Users className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">고객 관리</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            구매 고객 정보를 등록하고 분양 이력과 연결합니다.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex gap-2 items-start">
              <ChevronRight className="size-4 text-primary shrink-0 mt-0.5" />
              <span>고객 이름, 연락처 등 기본 정보를 등록합니다.</span>
            </div>
            <div className="flex gap-2 items-start">
              <ChevronRight className="size-4 text-primary shrink-0 mt-0.5" />
              <span>분양 등록 시 <strong>QR 스캔</strong> 버튼으로 판매 개체를 빠르게 선택할 수 있습니다.</span>
            </div>
            <div className="flex gap-2 items-start">
              <ChevronRight className="size-4 text-primary shrink-0 mt-0.5" />
              <span>등록된 고객은 판매이력 관리에서 분양 기록과 연결됩니다.</span>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── 판매이력 관리 ── */}
        <section>
          <SectionAnchor id="sales" />
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">판매이력 관리</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            개체 판매 기록을 관리하고 현황을 조회합니다.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex gap-2 items-start">
              <ChevronRight className="size-4 text-primary shrink-0 mt-0.5" />
              <span>판매 날짜, 판매 가격, 고객 정보를 연결하여 기록합니다.</span>
            </div>
            <div className="flex gap-2 items-start">
              <ChevronRight className="size-4 text-primary shrink-0 mt-0.5" />
              <span>판매 현황 조회 및 보고서 출력이 가능합니다.</span>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── QR 스캔 ── */}
        <section>
          <SectionAnchor id="qr" />
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">QR 스캔</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            개체 QR 코드를 스캔하여 정보를 즉시 조회합니다.
          </p>
          <TipBox>
            사이드바 하단의 <strong>QR 스캔</strong> 버튼을 누르면 카메라가 열립니다. 개체 QR을 스캔하면 개체 상세 보기, 피딩 캘린더, 판매 이력 등으로 바로 이동할 수 있습니다.
          </TipBox>
        </section>

        <Separator />

        {/* ── 양수양도 신고서 ── */}
        <section>
          <SectionAnchor id="transfer" />
          <div className="flex items-center gap-2 mb-4">
            <FileText className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">양수양도 신고서</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            파충류 분양·입양 시 관할 시청 제출용 신고서를 PDF로 생성합니다.
          </p>

          <Accordion type="multiple">
            <AccordionItem value="transfer-sell-1">
              <AccordionTrigger className="text-sm">판매 시 — 방법 1 (분양 등록 연동)</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <Step n={1}><strong>고객 관리</strong>에서 고객 정보를 입력합니다.</Step>
                <Step n={2}>분양할 개체 정보를 입력 후 분양 등록을 완료합니다.</Step>
                <Step n={3}><strong>판매이력 관리</strong>에 해당 건이 <Badge variant="secondary" className="text-xs">신고 대기</Badge> 상태로 등록됩니다.</Step>
                <Step n={4}>상단의 <strong>양도신고서 다운로드</strong> 버튼을 누르면 PDF가 생성되고 상태가 자동으로 신고 완료로 변경됩니다.</Step>
                <TipBox>양수신고서는 출력 후 고객에게 전달하고, 양도신고서는 시청에 제출합니다.</TipBox>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="transfer-sell-2">
              <AccordionTrigger className="text-sm">판매 시 — 방법 2 (직접 작성)</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <Step n={1}>메뉴 바 하단 <strong>양수양도 신고서</strong>를 클릭합니다.</Step>
                <Step n={2}><strong>양도</strong>를 선택합니다.</Step>
                <Step n={3}>양도자 정보, 양수자 정보, 개체 정보, 신고인, 분양일 등을 입력합니다.</Step>
                <Step n={4}>PDF 다운로드 후 출력하여 시청에 제출합니다.</Step>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="transfer-buy">
              <AccordionTrigger className="text-sm">입양 시 — 양수신고서 작성</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <Step n={1}>메뉴 바 하단 <strong>양수양도 신고서</strong>를 클릭합니다.</Step>
                <Step n={2}><strong>양수</strong>를 선택합니다.</Step>
                <Step n={3}>양도자 정보, 양수자 정보, 개체 정보, 신고인, 분양일 등을 입력합니다.</Step>
                <Step n={4}>PDF 다운로드 후 출력하여 시청에 제출합니다.</Step>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* ── AI 음성 도우미 ── */}
        <section>
          <SectionAnchor id="ai" />
          <div className="flex items-center gap-2 mb-4">
            <Bot className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">AI 음성 도우미</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            음성 또는 채팅으로 기록과 문의를 처리합니다. 사이드바 하단 또는 모바일 홈 화면에서 접근할 수 있습니다.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {[
              { title: '특정 개체 피딩', desc: '"레오 귀뚜라미 줬어" — 개체 검색 후 피딩 기록 저장' },
              { title: '전체/성별 일괄 피딩', desc: '"전체 사료 줬어", "수컷들 밀웜 줬어" — 일괄 기록' },
              { title: '일부 제외 피딩', desc: '"전체 줬는데 바이는 빼줘" — 특정 개체 제외 후 저장' },
              { title: '슈퍼푸드 포함', desc: '"귀뚜라미 슈퍼푸드 포함해서 줬어" — 슈퍼푸드 자동 체크' },
              { title: '개체 검색', desc: '"레오 찾아줘" — 이름/번호로 검색 결과 표시' },
              { title: '기능 안내', desc: '"메이팅 어떻게 해?" — 기능 사용법 질문 답변' },
            ].map(c => (
              <Card key={c.title} className="border-border">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <TipBox>
            AI가 답변을 완료하면 자동으로 음성 인식 대기 상태로 전환됩니다. 연속으로 말해도 자연스럽게 대화가 이어집니다.
          </TipBox>
        </section>

      </main>
    </div>
  )
}
