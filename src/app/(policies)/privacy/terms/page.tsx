import Image from 'next/image'

export default function TermsPage() {
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
        {/* 제목 */}
        <section className="mb-12">
          <h1 className="mb-6 text-3xl font-bold text-gray-900">이용약관</h1>
        </section>

        {/* 제 1 조 목적 */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">제 1 조 목적</h2>
          <div className="rounded-lg bg-gray-50 p-6">
            <p className="text-gray-700">
              포브리더스(이하 &quot;회사&quot;)의 포브리더스 개체 관리 서비스를
              이용해 주셔서 감사합니다. 회사는 고객이 회사가 제공하는 서비스를
              원활히 제공하기 위해 약관(이하 &apos;본 약관&apos;)은 고객이
              서비스를 이용하는 데 필요한 권리, 의무 및 책임사항, 이용조건 및
              절차 등 기본적인 사항을 규정하고 있습니다.
            </p>
          </div>
        </section>

        {/* 제 2 조 용어정의 */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            제 2 조 용어정의
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="mb-3 font-semibold text-gray-900">
                1. 본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
              </p>
              <ul className="ml-4 space-y-2 text-gray-700">
                <li>
                  • <strong>서비스:</strong> 파충류 개체 관리 시스템을
                  말합니다. (URL : https://fobreeders.com)
                </li>
                <li>
                  • <strong>유료서비스:</strong> 회사가 제공하는 서비스 중
                  회원이 회사에 일정 금액을 결제하거나, 회원이 회사 또는
                  제3자와의 거래 내지 약정 조건을 수락하는 경우에 이용할 수 있는
                  서비스를 말합니다.
                </li>
                <li>
                  • <strong>이용자:</strong> 서비스를 이용하는 회원 또는
                  비회원을 말합니다.
                </li>
                <li>
                  • <strong>회원:</strong> 본 약관에 따라 회사에 회원 등록을 한
                  자로서 회사가 제공하는 서비스를 이용하는 자를 말합니다.
                </li>
              </ul>
            </div>
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-gray-700">
                2. 이 약관에서 사용하는 용어의 정의는 제1항에서 정하는 것을
                제외하고는 관련법령에서 정하는 바에 의하며, 관련 법령에서 정하지
                않는 것은 일반적인 상관례에 의합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 제 3 조 약관의 명시, 효력 및 변경, 약관 외 준칙 */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            제 3 조 약관의 명시, 효력 및 변경, 약관 외 준칙
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-gray-700">
                1. 본 약관의 내용은 회사가 제공하는 개별 서비스 또는 서비스 초기
                화면에 게시하거나 기타의 방법으로 공지하고, 본 약관에 동의한 고객
                모두에게 그 효력이 발생합니다.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-gray-700">
                2. 회사는 필요한 경우 관련법령을 위배하지 않는 범위 내에서 본
                약관을 변경할 수 있습니다. 본 약관이 변경되는 경우 회사는
                변경사항을 시행일자 7일 전부터 고객에게 회사의 포브리더스 개체
                관리 시스템 공지사항에서 공지 또는 통지하는 것을 원칙으로 합니다.
                만약 고객에게 불리한 내용으로 변경할 경우에는 그 시행일자 15일
                전부터 이메일을 발송하거나, 고객이 등록한 휴대폰번호로 메신저
                메시지 또는 문자메시지를 보내거나, 서비스 내 전자알림 발송 등
                합리적으로 가능한 방법으로 변경사항을 공지 또는 통지하겠습니다.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-gray-700">
                3. 회사가 전 항에 따라 공지 또는 통지를 하면서 공지 또는
                통지일로부터 개정약관 시행일 7일 후까지 거부의사를 표시하지
                아니하면 승인한 것으로 본다는 뜻을 명확하게 고지하였음에도
                고객의 의사표시가 없는 경우에는 변경된 약관을 승인한 것으로
                봅니다. 고객이 개정약관에 동의하지 않을 경우 고객은 제11조
                제1항에 따라 이용계약을 해지할 수 있습니다.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-gray-700">
                본 약관에 규정되지 않은 사항에 대해서는 관련법령 또는 회사가
                정한 서비스의 개별 이용약관, 운영정책 및 규칙 등(이하
                &apos;세부지침&apos;)의 규정에 따릅니다. 또한 본 약관과
                세부지침의 내용이 충돌할 경우 세부지침에 따릅니다.
              </p>
            </div>
          </div>
        </section>

        {/* 제 2 장 */}
        <section className="mb-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            제 2 장 회사의 포브리더스 개체 관리 시스템 계정
          </h2>

          {/* 제 4 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 4 조 회사의 포브리더스 개체 관리 시스템 아이디 생성 거절 및
              유보
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="mb-3 font-semibold text-gray-900">
                  1. 회사는 아래와 같은 경우에는 고객의 계정 아이디의 생성을
                  승낙하지 않을 수 있습니다.
                </p>
                <ul className="ml-4 space-y-2 text-gray-700">
                  <li>
                    • 회사가 본 약관에 의해 고객의 계정을 삭제하였던 경우
                  </li>
                  <li>
                    • 고객이 다른 사람의 명의나 이메일 주소 등 개인정보를
                    이용하여 회사의 포브리더스 개체 관리 시스템 계정을
                    생성하려 한 경우
                  </li>
                  <li>
                    • 회사 계정 생성시 필요한 정보를 입력하지 않거나 허위의
                    정보를 입력한 경우
                  </li>
                  <li>
                    • 기타 관련법령에 위배되거나 세부지침 등 회사가 정한 기준에
                    반하는 경우
                  </li>
                </ul>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  2. 만약, 위 조건에 위반하여 계정을 생성한 것으로 판명된 때에는
                  회사는 즉시 고객의 서비스 이용을 중단하거나 계정을 삭제하는 등
                  적절한 제한을 할 수 있습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="mb-3 font-semibold text-gray-900">
                  3. 회사는 아래와 같은 경우에는 고객의 계정 생성을 유보할 수
                  있습니다.
                </p>
                <ul className="ml-4 space-y-2 text-gray-700">
                  <li>• 제공 서비스 설비용량에 현실적인 여유가 없는 경우</li>
                  <li>
                    • 서비스 제공을 위한 기술적인 부분에 문제가 있다고 판단되는
                    경우
                  </li>
                  <li>
                    • 기타 회사가 재정적, 기술적으로 필요하다고 인정하는 경우
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 제 5 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 5 조 회사의 포브리더스 개체 관리 시스템 아이디 등의 관리
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  1. 회사의 포브리더스 개체 관리 시스템 아이디는 고객 본인만
                  이용할 수 있으며, 다른 사람이 고객의 포브리더스 개체 관리
                  시스템 아이디를 이용하도록 허락할 수 없습니다. 그리고 고객은
                  다른 사람이 고객의 포브리더스 개체 관리 시스템 아이디를
                  무단으로 사용할 수 없도록 직접 비밀번호를 관리하여야 합니다.
                  회사는 다른 사람이 고객의 아이디를 무단으로 사용하는 것을 막기
                  위하여 비밀번호 입력 및 추가적인 본인 확인 절차를 거치도록 할
                  수 있습니다. 만약 무단 사용이 발견된다면, 고객센터를 통하여
                  회사에게 알려주시기 바라며, 회사는 무단 사용을 막기 위한 방법을
                  고객에게 안내하도록 하겠습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  2. 고객은 서비스 내 설정 화면을 통하여 개인정보를 열람하고
                  수정할 수 있습니다. 다만, 서비스의 제공 및 관리를 위해 필요한
                  아이디(이메일), 전화번호, 기타 본인확인정보 등 일부 정보는
                  수정이 불가능할 수 있으며, 수정하는 경우에는 추가적인 본인 확인
                  절차가 필요할 수 있습니다. 고객이 서비스 이용 신청 시 알려주신
                  내용에 변동이 있을 때, 직접 서비스에서 수정하거나 이메일,
                  고객센터를 통하여 회사에 알려 주시기 바랍니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  3. 고객이 서비스 내 정보를 수정하지 않아 발생하는 손해에
                  대하여 회사는 책임을 부담하지 않습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  4. 위의 사항을 위반하여 타인의 명의를 도용하거나 실명으로
                  등록하지 않은 이용자의 경우 관계법령에 따라 처벌 받을 수
                  있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 제 3 장 */}
        <section className="mb-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            제 3 장 서비스의 이용
          </h2>

          {/* 제 6 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 6 조 다양한 서비스 제공 및 변경 등
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  1. 회사는 파충류 개체 관리 서비스 등을 제공합니다. 고객은
                  웹페이지에 접속하여 서비스를 이용할 수 있습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  2. 회사는 더 나은 서비스를 위하여 서비스에 필요한 소프트웨어의
                  업데이트 버전을 제공할 수 있습니다. 소프트웨어의 업데이트에는
                  중요한 기능의 추가 또는 불필요한 기능의 제거 등이 포함되어
                  있습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  3. 회사는 더 나은 서비스의 제공을 위하여 고객에게 서비스의
                  이용과 관련된 각종 고지, 관리 메시지 및 기타 광고를 비롯한
                  다양한 정보를 서비스에 표시하거나 고객의 메일 계정으로 직접
                  발송할 수 있습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  4. 서비스 이용 중 시스템 오류 등 문제점을 발견하신다면 언제든지
                  회사 고객 센터로 알려주시기 바랍니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  5. 고객이 서비스를 이용하는 과정에서 Wi-Fi 무선인터넷을
                  사용하지 않고, 가입하신 이동통신사의 무선인터넷에 연결하여
                  이용하는 경우 이동통신사로부터 고객에게 별도의 데이터
                  통신요금이 부과되는 점을 유의하여 주시기 바랍니다. 서비스 이용
                  과정에서 발생하는 데이터 통신요금은 고객이 고객의 비용과 책임
                  하에 이동통신사에 납부하셔야 합니다. 데이터 통신요금에 대한
                  자세한 안내는 고객이 가입하신 이동통신사에 문의하시기 바랍니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  6. 전항까지 서비스 제공 및 광고 게재가 회사가 아닌 제3자가
                  주체인 경우 회원이 참여하거나 거래 함으로써 발생하는 손실과
                  손해에 대해 회사는 어떠한 책임도 부담하지 않습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 제 7 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 7 조 서비스 이용 방법 및 주의점
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="mb-3 font-semibold text-gray-900">
                  1. 고객은 서비스를 자유롭게 이용할 수 있으나, 아래와 같이
                  서비스를 잘못된 방법으로 이용할 수 없다는 점을 잊지
                  말아주셨으면 합니다.
                </p>
                <ul className="ml-4 space-y-2 text-gray-700">
                  <li>
                    • 고객은 잘못된 방법으로 서비스의 제공을 방해하거나 회사가
                    안내하는 방법 이외의 다른 방법을 사용하여 서비스에 접근할 수
                    없습니다.
                  </li>
                  <li>
                    • 다른 서비스 이용자의 정보를 무단으로 수집, 이용하거나 다른
                    사람들에게 제공하는 행위도, 서비스를 영리 목적으로 이용하는
                    것도, 음란 정보나 저작권 침해, 회사나 제3자 등에 대한 허위의
                    사실을 게시하는 정보 등 공서양속 및 법령에 위반되는 내용의
                    정보 등을 발송하거나 게시하는 행위도 금지됩니다.
                  </li>
                  <li>
                    • 회사의 동의 없이 서비스 또는 이에 포함된 소프트웨어의
                    일부를 복사, 수정, 배포, 판매, 양도, 대여, 담보제공하거나
                    타인에게 그 이용을 허락하는 행위와 소프트웨어를 역설계하거나
                    소스 코드의 추출을 시도하는 등 서비스를 복제, 분해 또는
                    모방하거나 기타 변형하는 행위도 금지됩니다.
                  </li>
                </ul>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  2. 고객은 서비스의 이용권한, 기타 이용 계약상 지위를 타인에게
                  양도·증여할 수 없으며, 담보로 제공할 수 없습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  3. 혹시라도 고객이 관련 법령, 회사의 모든 약관 또는 정책을
                  준수하지 않는다면, 회사는 고객의 위반행위 등을 조사할 수 있고,
                  해당 게시물 등을 삭제 또는 임시 삭제하거나 고객의 서비스 이용을
                  잠시 또는 계속하여 중단하거나, 재가입에 제한을 둘 수도 있습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  4. 회사는 법령에서 정하는 기간 동안 고객이 서비스를 이용하기
                  위해 로그인 혹은 접속한 기록이 없는 경우 고객이 등록한
                  이메일주소, 휴대폰번호로 이메일, 문자메시지 또는 등록된 메신저
                  메시지를 보내는 등 기타 유효한 수단으로 통지 후 고객의 정보를
                  분리 보관할 수 있으며, 이로 인해 서비스 이용을 위한 필수적인
                  정보가 부족할 경우 이용계약이 해지될 수도 있습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  5. 고의 또는 악의로 개체 등록 등의 작업을 반복 사용하여 회사의
                  운영에 피해를 끼치는 이용자의 사용을 중단(이용 정지 또는 계약
                  해지)시킬 수 있습니다. 이에 따라 서비스 이용을 통해 획득한
                  혜택 등은 모두 소멸되며, 회사는 이에 대해 별도의 보상을 하지
                  않습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 제 8 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 8 조 권리의 귀속
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  1. 고객이 등록한 개체에 대한 등록내역은 권리자가 계속하여
                  보유합니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  2. 서비스 및 서비스 내 회사가 제작한 콘텐츠 등에 대한 저작권 및
                  지적재산권은 회사에 귀속됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 제 9 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 9 조 유료 서비스의 이용
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  1. 회사는 개인을 대상으로 일정범위 내에서 무료로 서비스를
                  제공하고 있으나, 일부 서비스의 경우 유료로 제공할 수 있습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  2. 고객이 회사가 제공하는 유료서비스를 이용하는 경우 이용대금을
                  납부한 후 이용하는 것을 원칙으로 합니다. 회사가 제공하는
                  유료서비스에 대한 이용요금의 결제 방법은 신용카드결제, 계좌이체,
                  무통장입금 등이 있으며 각 유료서비스마다 결제 방법의 차이가
                  있을 수 있습니다. 매월 정기적인 결제가 이루어지는 서비스의 경우
                  고객 개인이 해당 서비스의 이용을 중단하고 정기 결제의 취소를
                  요청하지 않는 한 매월 결제가 이루어집니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  3. 회사는 결제의 이행을 위하여 반드시 필요한 고객의 개인정보를
                  추가적으로 요구할 수 있으며, 고객은 회사가 요구하는 개인정보를
                  정확하게 제공하여야 합니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  4. 요금제 신청 및 결제 후 요금제에서 제공된 서비스(계약 전송 건
                  수)를 이용하지 않은 상태에서 7일 이내에 환불 요청을 할 경우
                  전액 환불 가능합니다. 단, 환불 방식에 따라 관련 수수료가 공제될
                  수 있으며, 무료로 제공된 서비스가 있을 경우 공제될 수 있습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  5. 유료서비스를 사용하는 회원이 유료서비스 공급일 이후 제공되는
                  계약 전송 건을 사용하지 않았더라도 청약 철회가 가능한
                  기간(유료서비스 공급일로부터 7일 이내)을 경과하여 청약 철회를
                  신청하면 환불은 불가능합니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="mb-3 font-semibold text-gray-900">
                  6. 상기의 규정에도 불구하고 아래 각 호의 경우에는 고객 개인이
                  결제한 전액을 환불합니다.
                </p>
                <ul className="ml-4 space-y-2 text-gray-700">
                  <li>
                    • 고객이 결제를 완료한 후 서비스를 이용한 내역이 없는 경우
                  </li>
                  <li>
                    • 서비스 장애 또는 회사가 제시한 최소한의 기술사양을
                    충족하였음에도 불구하고 회사의 귀책사유로 서비스를 이용하지
                    못한 경우
                  </li>
                  <li>• 고객이 구매한 서비스가 제공되지 않은 경우</li>
                  <li>
                    • 제공되는 서비스가 표시·광고 등과 상이하거나 현저한 차이가
                    있는 경우
                  </li>
                  <li>
                    • 제공되는 서비스의 결함으로 서비스의 정상적인 이용이 현저히
                    불가능한 경우
                  </li>
                </ul>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  7. 회사는 과오금이 발생한 경우 또는 전액 환불의 경우 이용대금의
                  결제와 동일한 방법으로 환불하여야 합니다. 다만, 동일한 방법으로
                  환불이 불가능하거나 서비스의 중도해지로 인한 부분 환불 등의
                  경우에는 회사가 정하는 별도의 방법으로 환불합니다. 회사는 환불
                  의무가 발생한 날로부터 7영업일 이내에 환불을 진행합니다.
                </p>
              </div>
            </div>
          </div>

          {/* 제 10 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 10 조 서비스의 이용, 변경 및 종료
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  1. 회사의 포브리더스 개체 관리 시스템 서비스는 상당한 이유가
                  있는 경우에 운영상, 기술상의 필요에 따라 제공하고 있는 전부
                  또는 일부 서비스를 변경할 수 있습니다. 정당한 사유에 따라
                  서비스를 일시 중단하더라도 그로 인해 이용자가 입은 손실을
                  보상하지 않습니다
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  2. 회사는 정기적 또는 부정기적 서비스 시스템 점검, 보안 강화,
                  기타 운영상의 사유 등으로 공지하여 서비스를 일시 중단할 수
                  있습니다. 정당한 사유에 따라 서비스를 일시 중단하더라도 그로
                  인해 이용자가 입은 손실을 보상하지 않습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 제 11 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 11 조 회원의 이용계약 해지
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  1. 고객이 서비스의 이용을 더 이상 원치 않는 때에는 언제든지
                  서비스 내 제공되는 메뉴를 이용하여 서비스 이용계약의 해지
                  신청을 할 수 있으며, 회사는 법령이 정하는 바에 따라 신속히
                  처리하겠습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="mb-3 text-gray-700">
                  2. 이용계약이 해지되면 회원의 모든 정보는 탈퇴 시점 이후 바로
                  삭제되며 복구할 수 없습니다. 단, 다음 각 호에 해당하는 경우는
                  삭제되지 않습니다.
                </p>
                <p className="ml-4 text-gray-700">
                  1) 관련법령 및 회사의 개인정보 처리방침에서 정한 바에 따라
                  특별히 회원과 관계된 정보를 저장해야할 때
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  3. 유료서비스 이용계약의 해지는 고객의 서비스 해지 신청 및
                  회사의 승낙에 의해 성립하게 되고, 환불할 금액이 있는 경우
                  환불도 이루어 지게 됩니다. 다만 각 개별 유료서비스에서 본
                  약관과 다른 계약해지 방법 및 효과를 규정하고 있는 경우 각
                  개별약관의 규정에 따릅니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  4. 회원은 탈퇴 시점 이후 1년 이내에 동일한 이메일 주소로 다시
                  가입할 수 없습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 제 12 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 12 조 개인정보의 보호 및 비밀유지
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  1. 고객의 개인정보의 안전한 처리는 회사에게 있어 가장 중요한 일
                  중 하나입니다. 고객의 개인정보는 서비스의 원활한 제공을 위하여
                  고객이 동의한 목적과 범위 내에서만 이용됩니다. 법령에 의하거나
                  고객이 별도로 동의하지 아니하는 한 회사가 고객의 개인정보를
                  제3자에게 제공하는 일은 결코 없습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  2. 회사와 고객은 서비스 이용과정에서 취득한 상대방의
                  업무상(또는 영업상) 비밀 등에 대하여 서비스 사용기간 및 서비스
                  만료(또는 해지) 이후에도 상대방의 사전 서면동의 없이 본 약관
                  이외의 목적으로 사용하거나 제3자에게 누설 또는 공개하지
                  않습니다. 이미 공개된 정보, 관계 법령에 의하여 공개가 강제되는
                  경우, 법원 기타 감독기관의 요청에 의하여 부득이하게 공개를 해야
                  하는 경우에는 예외로 합니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  3. 서비스를 이용하는 과정에서 전자계약서나 기타 서비스이용 시
                  활용하는 개인정보의 경우 개인정보 수집·이용 동의에 근거하여
                  처리합니다
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  4. 서비스 제공을 위하여 필수적으로 필요한 개인정보는 모두
                  암호화하여 관리합니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  5. 전자계약의 체결에 고유식별정보가 필요한 경우 해당
                  고유식별정보가 필요한 계약당사자 중 일방(개인정보처리자)이 별도
                  동의 수령 후 전자계약을 체결하여야 합니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  6. 전자계약의 체결에 주민등록번호가 필요한 경우 계약당사자 중
                  일방(개인정보처리자)이 주민등록번호 처리에 필요한 근거법령을
                  반드시 확인 후 계약서를 작성하여야 하며, 회사의 포브리더스 개체
                  관리 시스템 서비스는 개인정보처리 수탁자의 위치에서 해당
                  주민등록번호 처리를 위탁받아 전자계약 서비스를 제공하게 됩니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 제 4 장 */}
        <section className="mb-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">제 4 장 기타</h2>

          {/* 제 13 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 13 조 손해배상 등
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  1. 회사는 법령상 허용되는 한도 내에서 서비스와 관련하여 본
                  약관에 명시되지 않은 어떠한 구체적인 사항에 대한 약정이나
                  보증을 하지 않습니다. 또한, 회사는 타사의 제휴를 통해 제공하거나
                  회원이 작성하는 등의 방법으로 서비스에 게재된 정보, 자료, 사실의
                  신뢰도, 정확성 등에 대해서는 보증을 하지 않으며 이로 인해
                  발생한 고객의 손해에 대하여는 책임을 부담하지 않습니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="mb-3 font-semibold text-gray-900">
                  2. 회사는 회사의 과실로 인하여 고객이 손해를 입게 될 경우 본
                  약관 및 법령에 따라 고객의 손해를 배상하겠습니다. 다만 회사는
                  아래와 같은 손해에 대해서는 책임을 부담하지 않습니다. 또한
                  회사는 법률상 허용되는 한도 내에서 간접 손해, 특별 손해, 결과적
                  손해, 징계적 손해, 및 징벌적 손해에 대한 책임을 부담하지
                  않습니다.
                </p>
                <ul className="ml-4 space-y-2 text-gray-700">
                  <li>
                    • 천재지변 또는 이에 준하는 불가항력의 상태에서 발생한 손해
                  </li>
                  <li>
                    • 고객의 귀책사유로 서비스 이용에 장애가 발생한 경우
                  </li>
                  <li>
                    • 서비스에 접속 또는 이용과정에서 발생하는 개인적인 손해
                  </li>
                  <li>
                    • 제3자가 불법적으로 회사의 서버에 접속하거나 서버를
                    이용함으로써 발생하는 손해
                  </li>
                  <li>
                    • 제3자가 회사 서버에 대한 전송 또는 회사 서버로부터의 전송을
                    방해함으로써 발생하는 손해
                  </li>
                  <li>
                    • 제3자가 악성 프로그램을 전송 또는 유포함으로써 발생하는
                    손해
                  </li>
                  <li>
                    • 전송된 데이터의 생략, 누락, 파괴 등으로 발생한 손해,
                    명예훼손 등 제3자가 서비스를 이용하는 과정에서 발생된 손해
                  </li>
                  <li>
                    • 기타 회사의 고의 또는 과실이 없는 사유로 인해 발생한 손해
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 제 14 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 14 조 회사의 의무
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  1. 회사는 본 약관 및 관련법령에서 금지하는 행위 및 미풍양속에
                  반하는 행위를 하지 않으며, 계속적이고 안정적인 서비스의 제공을
                  위하여 최선을 다하여 노력합니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  2. 회사는 회원이 안전하게 서비스를 이용할 수 있도록 신용정보를
                  포함한 일체의 개인정보 보호를 위한 보안시스템을 갖추어야 하며
                  개인정보처리방침을 공시하고 준수합니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  3. 회사는 회원으로부터 제기되는 의견이나 불만이 정당하다고
                  객관적으로 인정될 경우에는 합리적인 기간 내에 신속하게
                  처리하여야 합니다. 다만, 처리에 장기간이 소요되는 경우 회원에게
                  게시판 또는 이메일 등을 통하여 지체 사유를 안내하고 처리과정 및
                  처리결과를 전달합니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  4. 회사는 이용계약의 체결, 계약사항의 변경 및 해지 등 이용자와의
                  계약관련 절차 및 내용 등에 있어 이용자에게 편의를 제공하도록
                  노력합니다.
                </p>
              </div>
            </div>
          </div>

          {/* 제 15 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 15 조 회원의 의무
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="mb-3 font-semibold text-gray-900">
                  1. 회원은 회사에서 제공하는 서비스를 본래의 이용 목적 이외의
                  용도로 사용하거나 다음 각 호에 해당하는 행위를 해서는 안됩니다.
                </p>
                <ul className="ml-4 space-y-2 text-gray-700">
                  <li>
                    • 가입신청 또는 정보 변경을 목적으로 회사에 개인정보 등록시
                    실명이 아닌 정보 또는 다른 사람의 정보를 사용하거나 허위
                    사실을 기재하는 행위
                  </li>
                  <li>
                    • 타인으로 가장하거나 타인과의 관계를 허위로 명시하는 행위,
                    다른 회원의 계정 및 비밀번호를 도용, 부정하게 사용하는 행위
                  </li>
                  <li>
                    • 알려지거나 알려지지 않은 버그를 악용하여 서비스를 이용하는
                    행위
                  </li>
                  <li>
                    • 회사 및 제3자의 명예를 훼손하거나 업무를 방해하거나 회사 및
                    제3자에게 손해를 가하는 행위
                  </li>
                  <li>
                    • 회사의 지식재산권, 제3자의 지식재산권, 초상권 등 기타
                    권리를 침해하거나 회사의 승인을 받지 않고 다른 회원의
                    개인정보를 수집, 저장, 유포, 게시하는 행위
                  </li>
                  <li>
                    • 제3자를 기망하여 이득을 취하거나 회사가 제공하는 서비스를
                    불건전하게 이용하거나 하여 제3자에게 피해를 주는 행위
                  </li>
                  <li>
                    • 회사로부터 특별한 권리를 부여받지 않고 사이트를 변경하거나
                    사이트에 다른 프로그램을 추가 또는 삽입하거나 서버를 해킹,
                    역설계, 소스코드의 유출 및 변경, 별도의 서버를 구축하거나
                    웹사이트의 일부분을 임의로 변경 또는 도용하여 회사를 사칭하는
                    행위
                  </li>
                  <li>
                    • 회사의 직원이나 운영자를 가장, 사칭하거나 또는 타인의
                    명의를 도용하여 문서를 등록하거나 메일을 발송하는 행위
                  </li>
                  <li>
                    • 회사의 동의 없이 영리, 영업, 광고, 정치활동, 불법선거운동
                    등을 목적으로 서비스를 이용하는 행위
                  </li>
                  <li>• 본 서비스 이용 규칙에 반하는 서비스 이용 행위</li>
                  <li>
                    • 기타 공공질서 및 미풍양속을 위반하거나 불법적, 부당한 행위
                    및 법령에 위배되는 행위 및 그에 수반되는 제반 행위
                  </li>
                </ul>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  2. 회원은 본 서비스 이용 규칙, 회사 홈페이지 상의 공지사항 및
                  이용약관의 수정사항 등을 확인하고 이를 준수할 의무가 있으며
                  기타 회사의 업무에 방해되는 행위를 하여서는 안 됩니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="text-gray-700">
                  3. 회원의 계정과 체결한 계약 문서에 관한 관리 책임은 회원에게
                  있으며, 회원의 계정등 관리 소홀로 인한 어떠한 결과, 손실 및 또는
                  손해로부터 회사는 면책됩니다.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="mb-3 font-semibold text-gray-900">
                  4. 회사는 제1항, 제2항 및 다음 각 호의 어느 하나에 해당하는
                  행위의 구체적인 유형을 운영 정책에서 정할 수 있으며, 회원은
                  이를 준수할 의무가 있습니다.
                </p>
                <ul className="ml-4 space-y-2 text-gray-700">
                  <li>• 회원의 계정명, 비밀번호의 정함에 대한 제한</li>
                  <li>• 계정공유금지정책</li>
                  <li>• 요금정책</li>
                  <li>• 이용 계약 승낙 정책</li>
                  <li>
                    • 서비스를 활용한 불법행위 또는 그에 수반되는 행위 금지를
                    위한 제반 정책
                  </li>
                  <li>
                    • 기타 회원의 서비스 이용에 대한 본질적인 권리를 침해하지
                    않는 범위 내에서 회사가 운영상 필요하다고 인정하는 사항
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 제 16 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 16 조 통지 및 공지
            </h3>
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-gray-700">
                회사는 고객과의 의견 교환을 소중하게 생각합니다. 고객은 언제든지
                고객센터에 방문하여 의견을 개진할 수 있습니다. 회사는 고객이
                사용하는 이메일 주소로 이메일을 발송하거나, 고객이 등록한
                휴대폰번호로 메신저 메시지 또는 문자메시지를 보내거나, 서비스 내
                전자쪽지 발송, 알림 메시지를 띄우는 등 합리적으로 가능한 방법으로
                고객에게 공지 또는 통지 하며, 서비스 이용자 전체에 대한 공지는 3일
                이상 서비스 공지사항에 게시하며 이로서 효력이 발생합니다.
              </p>
            </div>
          </div>

          {/* 제 17 조 */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              제 17 조 분쟁의 해결
            </h3>
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-gray-700">
                본 약관 또는 서비스는 대한민국법령에 의하여 규정되고 이행됩니다.
                서비스 이용과 관련하여 회사와 고객 간에 분쟁이 발생하면 이의
                해결을 위해 성실히 협의할 것입니다. 그럼에도 불구하고 서비스
                이용과 관련하여 회사와 고객 사이에 분쟁이 발생한 경우에는 회사의
                소재지를 관할하는 법원을 제1심 관할법원으로 합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 공고일자 및 시행일자 */}
        <section className="mb-12">
          <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-6">
            <div className="space-y-2 text-gray-900">
              <p>
                <strong>공고일자:</strong> 2026년 01월 02일
              </p>
              <p>
                <strong>시행일자:</strong> 2026년 01월 02일
              </p>
            </div>
          </div>
        </section>
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
