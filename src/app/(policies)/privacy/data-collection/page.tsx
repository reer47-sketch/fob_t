import Image from 'next/image'

export default function DataCollectionPage() {
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
            개인정보 수집 및 이용에 대한 동의서
          </h1>

          {/* 서문 */}
          <p className="leading-relaxed text-gray-700">
            포브리더스(이하 &ldquo;회사&rdquo;)는 개인정보보호법에 따라 아래와 같이 귀하의 개인정보를 수집 및 이용하고자 합니다. 본 내용을 충분히 숙지하신 후 동의 여부를 결정하여 주시기 바랍니다.
          </p>

          {/* 섹션 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              1. 개인정보의 수집 및 이용 목적
            </h2>
            <ul className="ml-6 list-disc space-y-1 text-gray-700">
              <li>서비스 제공 및 사업 처리</li>
              <li>고객 관리 및 상담</li>
              <li>마케팅 및 정보 전달</li>
              <li>법적 의무 준수</li>
            </ul>
          </section>

          {/* 섹션 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              2. 수집하는 개인정보의 항목
            </h2>
            <ul className="ml-6 list-disc space-y-1 text-gray-700">
              <li>필수항목: 성명, 생년월일, 연락처(전화번호, 이메일 주소)</li>
              <li>선택항목: 주소, 관심사 등</li>
            </ul>
          </section>

          {/* 섹션 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              3. 개인정보의 보유 및 이용 기간
            </h2>
            <ul className="ml-6 list-disc space-y-1 text-gray-700">
              <li>수집 및 이용 목적 달성 시까지 보유</li>
              <li>관련 법령에 의해 보존이 필요한 경우 해당 기간까지 보유</li>
            </ul>
          </section>

          {/* 섹션 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              4. 개인정보의 제3자 제공 (해당 시에만 기재)
            </h2>
            <ul className="ml-6 list-disc space-y-1 text-gray-700">
              <li>제공받는 자: [제공받는 자명]</li>
              <li>제공받는 자의 이용 목적: [이용 목적]</li>
              <li>제공받는 자의 보유 및 이용 기간: [보유 기간]</li>
            </ul>
          </section>

          {/* 섹션 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              5. 정보주체의 권리
            </h2>
            <ul className="ml-6 list-disc space-y-1 text-gray-700">
              <li>개인정보의 열람, 정정, 삭제, 처리정지 요구권</li>
              <li>동의 철회권</li>
              <li>동의 거부권 및 거부에 따른 불이익</li>
            </ul>
          </section>

          {/* 섹션 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              6. 개인정보 보호책임자
            </h2>
            <ul className="ml-6 list-disc space-y-1 text-gray-700">
              <li>책임자: 안영준</li>
              <li>연락처: sys.forbreeders@gmail.com</li>
            </ul>
          </section>

          {/* 동의 문구 */}
          <div className="border-t border-gray-200 pt-8">
            <p className="text-center font-medium text-gray-900">
              위와 같이 회사가 개인정보를 수집 및 이용하는 것에 동의합니다.
            </p>
          </div>

          {/* 주의사항 */}
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              ※ 귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수항목에 대한 동의를 거부할 경우 서비스 제공이 제한될 수 있습니다.
            </p>
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
