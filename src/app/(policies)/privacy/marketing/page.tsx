import Image from 'next/image'

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Image
            src="/top-logo.png"
            alt="포브리더스"
            width={180}
            height={40}
            className="h-10 w-auto"
          />
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
          {/* 제목 */}
          <h1 className="text-center text-3xl font-bold text-gray-900">
            마케팅 정보 수신 동의 (선택)
          </h1>

          {/* 메인 내용 */}
          <div className="space-y-6 leading-relaxed text-gray-700">
            <section className="space-y-2">
              <h2 className="font-semibold text-gray-900">목적</h2>
              <p>서비스 소식 전달 및 홍보, 이벤트 소식, 혜택 안내, 경품/쿠폰 안내</p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold text-gray-900">항목</h2>
              <ul className="ml-6 space-y-1">
                <li>(필수) 이메일, 이름, 전화번호</li>
                <li>(선택) 주소</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold text-gray-900">보유기간</h2>
              <p>회원 탈퇴 시까지</p>
            </section>

            <div className="space-y-4 border-t pt-6 text-gray-600">
              <p>
                ※ 본 동의는 마케팅 활용을 위한 것으로 동의하지 않더라도 포브리더스가 제공하는 서비스를 이용할 수 있습니다.
              </p>
              <p>
                * 회원가입 후, 계정 관리 페이지에서 마케팅 정보 수집 이용과 관련된 소식 알림 및 수신 설정을 해제할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="mt-16 border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm text-gray-500">
          <p>&copy; 2025 포브리더스. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
