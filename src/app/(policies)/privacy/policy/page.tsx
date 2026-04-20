import Image from 'next/image'

export default function PrivacyPolicyPage() {
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
        {/* 개요 */}
        <section className="mb-12">
          <h1 className="mb-6 text-3xl font-bold text-gray-900">
            개인정보처리방침
          </h1>
          <p className="leading-relaxed text-gray-700">
            포브리더스(이하 &quot;회사&quot;)의 포브리더스 개체 관리 서비스는
            이용자의 동의를 기반으로 개인정보를 처리하고 있으며,
            개인정보보호법에 따라 회원가입 시 수집하는 개인정보의 항목,
            개인정보의 수집 및 이용목적, 개인정보의 보유 및 이용기간 등을 아래와
            같이 고지합니다.
          </p>
        </section>

        {/* 1. 개인정보 처리 목적, 처리하는 개인정보의 항목, 개인정보의 처리 및 보유기간 */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            1. 개인정보 처리 목적, 처리하는 개인정보의 항목, 개인정보의 처리 및
            보유기간
          </h2>
          <p className="mb-6 text-gray-700">
            회사가 처리하는 개인정보의 처리 목적, 항목, 보유기간은 아래와
            같습니다.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                1.1 고객 개인정보
              </h3>

              <div className="mb-6 rounded-lg bg-gray-50 p-6">
                <h4 className="mb-3 font-semibold text-gray-900">
                  1.1.1 회원가입시점
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li>
                    <strong>개인정보의 처리 목적:</strong> 회사의 포브리더스 개체
                    관리 서비스 서비스 회원 가입 및 관리
                  </li>
                  <li>
                    <strong>개인정보의 항목:</strong>
                    <ul className="ml-6 mt-2 list-disc space-y-1">
                      <li>
                        [필수] 이메일 주소, 이름, 비밀번호, 탈퇴회원 재가입 확인
                        정보, 본인인증 값(이메일 인증)
                      </li>
                      <li>[선택] 전화번호</li>
                      <li>
                        소셜 계정을 통해 회원가입 시 아래와 같은 정보들이 추가로
                        수집될 수 있습니다.
                        <ul className="ml-6 mt-2 list-disc space-y-1">
                          <li>
                            카카오: 이메일 주소, 프로필 정보(닉네임, 프로필 사진)
                          </li>
                          <li>구글: 이메일 주소, 프로필 사진</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>개인정보 수집방법:</strong> 회사의 포브리더스 개체
                    관리 서비스 서비스 홈페이지 회원가입(온라인)
                  </li>
                  <li>
                    <strong>개인정보 보유기간:</strong> 서비스 부정이용방지를 위해
                    탈퇴회원 재가입 정보는 1년간 보관하며, 나머지 정보는
                    회원탈퇴 시 지체없이 파기합니다.
                  </li>
                </ul>
              </div>

              <div className="mb-6 rounded-lg bg-gray-50 p-6">
                <h4 className="mb-3 font-semibold text-gray-900">
                  1.1.2 서비스이용 시점
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li>
                    <strong>개인정보의 처리 목적:</strong> 회사의 포브리더스 개체
                    관리 서비스 제공
                  </li>
                  <li>
                    <strong>개인정보의 항목:</strong>
                    <ul className="ml-6 mt-2 list-disc space-y-1">
                      <li>
                        [필수] 전자 계약서/전자 문서 작성 시 포함되는 개인정보
                        항목 일체(이름, 연락처, 주소, 이메일, 생년월일 등), 서비스
                        이용내역, 서비스 구매내역, 결제내역(카드번호, 생년월일,
                        카드비밀번호 앞 2자리, 카드유효기간)
                      </li>
                      <li>
                        [선택] 본인인증 값(휴대폰 인증, PASS 인증, 공동인증)
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>개인정보 수집방법:</strong> 회사의 포브리더스 개체
                    관리 서비스 서비스 이용 시(온라인)
                  </li>
                  <li>
                    <strong>개인정보 보유기간:</strong> 원칙적으로 회원탈퇴 시
                    지체없이 파기합니다. 단, 서비스 부정이용방지를 위해 탈퇴회원
                    재가입 정보는 1년간 보관하고 있으며, 법령에서 일정기간
                    보관의무를 부여한 경우 해당 기간 동안 안전하게 보관합니다.
                  </li>
                </ul>

                <div className="mt-4 space-y-3 border-l-4 border-blue-500 bg-blue-50 p-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      ※ 전자상거래 등에서 소비자 보호에 관한 법률
                    </p>
                    <ul className="ml-4 mt-2 list-disc space-y-1 text-gray-700">
                      <li>계약 또는 청약철회 등에 관한 기록: 5년 보관</li>
                      <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 보관</li>
                      <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 보관</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      ※ 전자문서 및 전자거래 기본법
                    </p>
                    <ul className="ml-4 mt-2 list-disc space-y-1 text-gray-700">
                      <li>
                        공인전자주소를 통한 전자문서 유통에 관한 기록: 10년 보관
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      ※ 통신비밀보호법
                    </p>
                    <ul className="ml-4 mt-2 list-disc space-y-1 text-gray-700">
                      <li>로그인 기록: 3개월 보관</li>
                    </ul>
                  </div>
                </div>

                <p className="mt-4 text-gray-700">
                  또한, 1년간 서비스를 이용하지 않은 회원(휴면회원)의 개인정보를
                  별도로 분리하여 보관 및 관리하고 있습니다.
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-6">
                <h4 className="mb-3 font-semibold text-gray-900">
                  1.1.3 개인정보처리 목적
                </h4>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <p className="mb-2 font-semibold">• 회원관리</p>
                    <p className="ml-4">
                      회원제 서비스 제공 및 개선, 개인식별, 이용약관 위반 회원에
                      대한 이용 제한 조치, 서비스의 원활한 운영에 지장을 미치는
                      행위 및 서비스 부정이용 행위 제재, 가입 의사 확인, 가입 및
                      가입 횟수 제한, 만 14세 미만 아동의 개인정보 수집 시 법정
                      대리인 동의여부 확인, 추후 법정 대리인 본인확인, 분쟁
                      조정을 위한 기록 보존, 불만 처리 등 민원처리, 고지사항
                      전달, 회원탈퇴 의사의 확인 등
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 font-semibold">
                      • 신규 서비스 개발 및 마케팅·광고에의 활용
                    </p>
                    <p className="ml-4">
                      신규 서비스 개발 및 맞춤 서비스 제공, 통계학적 특성에 따른
                      서비스 제공 및 광고 게재, 서비스의 유효성 확인, 자사 및
                      제휴 이벤트 정보 및 참여 기회 제공, 광고성 정보 제공, 접속
                      빈도 파악, 회원의 서비스 이용에 대한 통계 분석 등
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 font-semibold">
                      • 서비스 제공에 관한 계약 이행 및 유료 서비스 제공에 따른
                      요금 정산
                    </p>
                    <p className="ml-4">
                      전자서명 서비스 제공, 콘텐츠 제공, 특정 맞춤 서비스 제공,
                      유료 서비스 이용에 대한 과금, 구매 및 요금 결제, 본인인증,
                      물품 배송 또는 청구서 등 발송, 요금 추심 등
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 font-semibold">• 법적 증거로 활용</p>
                    <p className="ml-4">법적 분쟁 시 증거자료 제출</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. 개인정보의 제3자 제공 */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            2. 개인정보의 제3자 제공
          </h2>
          <p className="mb-4 text-gray-700">
            회사는 정보주체의 개인정보를 회사의 포브리더스 개체 관리 서비스
            서비스 제공을 위해 명시한 목적 범위 내에서만 처리하고, 다음 각 호의
            경우 외에는 본래의 목적 범위를 초과하여 처리하거나 제3자에게
            개인정보를 제공하지 않습니다.
          </p>
          <ul className="mb-6 ml-6 list-disc space-y-2 text-gray-700">
            <li>정보주체로부터 별도의 동의를 받은 경우</li>
            <li>
              법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여
              불가피한 경우
            </li>
            <li>
              명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을
              위하여 필요하다고 인정되는 경우
            </li>
            <li>공중위생 등 공공의 안전과 안녕을 위하여 긴급히 필요한 경우</li>
          </ul>
          <p className="mb-4 text-gray-700">
            회사는 제3자 제공을 위해 동의를 받을 때에는 아래의 사항을
            정보주체에게 알립니다. 아래의 어느 하나의 사항을 변경하는 경우에도
            이를 알리고 동의를 받습니다.
          </p>
          <ol className="ml-6 list-decimal space-y-2 text-gray-700">
            <li>개인정보를 제공받는 자</li>
            <li>
              개인정보의 이용 목적(제공 시에는 제공받는 자의 이용 목적을
              말합니다.)
            </li>
            <li>이용 또는 제공하는 개인정보의 항목</li>
            <li>
              개인정보의 보유 및 이용 기간(제공 시에는 제공받는 자의 보유 및
              이용 기간을 말합니다.)
            </li>
            <li>
              동의를 거부할 권리가 있다는 사실 및 동의 거부에 따른 불이익이
              있는 경우에는 그 불이익의 내용
            </li>
          </ol>
        </section>

        {/* 3. 개인정보처리 위탁 */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            3. 개인정보처리 위탁
          </h2>
          <p className="mb-4 text-gray-700">
            회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리
            업무를 위탁하고 있습니다.
          </p>
          <div className="rounded-lg bg-gray-50 p-6">
            <h3 className="mb-3 font-semibold text-gray-900">
              3.1 개인 정보처리 업무 위탁
            </h3>
            <ul className="mb-4 space-y-2 text-gray-700">
              <li>
                <strong>위탁받는 자:</strong> Supabase
              </li>
              <li>
                <strong>위탁기간:</strong> 위탁 계약종료 시까지
              </li>
            </ul>
            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 text-sm text-gray-700">
              <p>
                ※ 위탁계약 체결 시 개인정보 보호법 제26조에 따라 위탁업무
                수행목적 외 개인정보 처리금지, 기술적∙관리적 보호조치, 재위탁
                제한, 수탁자에 대한 관리∙감독, 손해배상 등 책임에 관한 사항을
                계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게
                처리하는지를 감독하고 있습니다. 위탁업무의 내용이나 수탁자가
                변경될 경우에는 지체 없이 본 개인정보 처리방침을 통하여
                공개하도록 하겠습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 4. 정보주체의 권리·의무 및 행사방법 */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            4. 정보주체의 권리·의무 및 행사방법
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="mb-2 text-gray-700">
                <strong>4.1</strong> 정보주체는 회사에서 처리하는 자신의
                개인정보에 관한 열람을 요구할 수 있습니다. 다만, 다음 각 호의
                어느 하나에 해당하는 경우에는 정보주체에게 그 사유를 알리고
                열람을 제한하거나 거절할 수 있습니다.
              </p>
              <ul className="ml-6 list-disc space-y-1 text-gray-700">
                <li>법률에 따라 열람이 금지되거나 제한되는 경우</li>
                <li>
                  다른 사람의 생명∙신체를 해할 우려가 있거나 다른 사람의 재산과
                  그 밖의 이익을 부당하게 침해할 우려가 있는 경우
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-gray-700">
                <strong>4.2</strong> 회사는 개인정보 열람요구서를 받은 날로부터
                10일 이내에 정보주체의 해당 개인정보 열람 가능 여부를, 열람을
                연기하거나 거절하는 경우 그 사유를 통지합니다.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <p className="mb-2 text-gray-700">
                <strong>4.3</strong> 자신의 개인정보를 열람한 정보주체는 그
                개인정보의 정정 또는 삭제를 요구할 수 있습니다. 다만, 다른
                법령에서 그 개인정보가 수집 대상으로 명시되어 있는 경우에는 그
                삭제를 요구할 수 없습니다.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-gray-700">
                <strong>4.4</strong> 개인정보 정정∙삭제 요구서를 받았을 때에는
                10일 이내에 해당 개인정보의 정정∙삭제 조치를 취한 경우에는 그
                내역을, 정보주체의 요구에 응하지 아니하는 경우에는 그 사유 및
                이의제기 방법을 통지합니다.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <p className="mb-2 text-gray-700">
                <strong>4.5</strong> 정보주체는 자신의 개인정보 처리의 정지를
                요구할 수 있습니다. 회사는 지체 없이 정보주체의 요구에 따라
                개인정보 처리의 전부를 정지하거나 일부를 정지합니다. 다만,
                아래의 어느 하나에 해당하거나 다른 정당한 사유가 있는 경우
                정보주체의 처리정지 요구를 거절할 수 있습니다.
              </p>
              <ul className="ml-6 list-disc space-y-1 text-gray-700">
                <li>
                  법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여
                  불가피한 경우
                </li>
                <li>
                  다른 사람의 생명∙신체를 해할 우려가 있거나 다른 사람의 재산과
                  그 밖의 이익을 부당하게 침해할 우려가 있는 경우
                </li>
                <li>
                  개인정보를 처리하지 아니하면 정보주체와 약정한 서비스를
                  제공하지 못하는 등 계약의 이행이 곤란한 경우로서 정보주체가 그
                  계약의 해지 의사를 명확하게 밝히지 아니한 경우
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-gray-700">
                <strong>4.6</strong> 개인정보 처리정지 요구서를 받은 날로부터
                10일 이내에 해당 개인정보의 처리정지의 조치를 한 경우에는 그
                조치 사실을, 처리 정지 요구에 따르지 않은 경우에는 그 사실 및
                이유와 이의 제기 방법을 통지합니다.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-gray-700">
                <strong>4.7</strong> 정보주체는 권리를 행사하기 위하여 개인정보
                처리 방법에 관한 고시 [별지 8]의 개인정보 열람 요구서를 회사에
                직접 제출하거나, 전자우편 등을 통하여 제출할 수 있습니다.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-gray-700">
                <strong>4.8</strong> 상기 권리행사는 정보주체의 법정대리인이나
                위임을 받은 자 등 대리인을 통하여 하실 수 있습니다. 이 경우
                개인정보 처리 방법에 관한 고시 [별지 11]에 따른 위임장을
                제출해야 합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 5. 개인정보의 파기 */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            5. 개인정보의 파기
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-gray-700">
                <strong>5.1</strong> 회사는 보유기관의 경과, 개인정보의 처리 목적
                달성 등 그 개인정보가 불필요하게 되었을 때에는 지체 없이 그
                개인정보를 파기합니다.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="mb-2 text-gray-700">
                <strong>5.2</strong> 개인정보를 파기할 때 다음 각호의 구분에 따른
                방법으로 합니다.
              </p>
              <ul className="ml-6 list-disc space-y-1 text-gray-700">
                <li>전자적 파일 형태인 경우: 복원이 불가능한 방법으로 영구 삭제</li>
                <li>
                  기록물, 인쇄물, 서면, 그 밖의 기록매체인 경우: 파쇄 또는 소각
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 6. 개인정보의 안전성 확보조치 */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            6. 개인정보의 안전성 확보조치
          </h2>
          <p className="mb-4 text-gray-700">
            회사는 개인정보 보호법 제29조에 따라 다음과 같이 안전성 확보에
            필요한 기술적·관리적 및 물리적 조치를 취하고 있습니다.
          </p>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">
                6.1 내부 관리계획의 수립∙시행
              </h3>
              <p className="text-gray-700">
                개인정보의 안전한 처리를 위하여 내부
                관리계획(개인정보보호규정)을 수립하고 시행하고 있으며,
                시행결과에 대해 점검하고 있습니다. 또한 개인정보를 취급하는
                직원을 지정하여 관리 · 감독 및 교육하고 있습니다.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">
                6.2 정기적인 자체 감사 실시
              </h3>
              <p className="text-gray-700">
                개인정보 취급 관련 안전성 확보를 위해 정기적으로 자체 감사를
                실시하고 있습니다.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">
                6.3 악성프로그램 방지
              </h3>
              <p className="text-gray-700">
                개인정보 처리에 이용하는 단말기에 대해 백신 프로그램을 설치하여
                컴퓨터바이러스, 스파이웨어와 같은 악성프로그램의 침투여부를
                항시 점검하고 치료할 수 있도록 조치하고 있습니다.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">
                6.4 개인정보의 암호화
              </h3>
              <p className="text-gray-700">
                정보주체의 개인정보 중 비밀번호, 중요정보, 결제관련정보는
                암호화되어 저장 및 관리되고 있으며 중요한 데이터는 파일 및 전송
                데이터를 암호화하거나 파일 잠금 기능을 사용하는 등의 별도
                보안기능을 사용하고 있습니다.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">
                6.5 해킹 등에 대비한 기술적 대책
              </h3>
              <p className="text-gray-700">
                해킹, 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기
                위하여 보안프로그램을 설치하고 주기적인 점검을 하고 있습니다.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">
                6.6 개인정보에 대한 접근통제 및 접근권한의 제한
              </h3>
              <p className="text-gray-700">
                개인정보처리 시스템에 접근권한을 업무수행에 필요한 최소한의
                범위로 업무 담당자에 따라 차등 부여하고 접근권한
                부여∙변경∙말소 기록을 관리함으로써 개인정보에 대한 접근제한
                조치를 취하고 있습니다. 또한 외부로부터의 불법적인 접근 및
                침해사고를 방지하기 위하여 보안장비를 설치하여 개인정보에 대한
                접근통제에 필요한 조치를 운영하고 있습니다.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">
                6.7 접속기록의 보관 및 위∙변조 방지
              </h3>
              <p className="text-gray-700">
                개인정보처리시스템에 접속한 기록을 최소 2년 이상 보관하고 매월
                점검하고 있습니다.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">
                6.8 문서보안을 위한 잠금장치 사용
              </h3>
              <p className="text-gray-700">
                개인정보가 포함된 서류, 보조저장매체 등을 잠금장치가 있는
                안전한 장소에 보관하고 있습니다.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">
                6.9 비인가자에 대한 출입 통제
              </h3>
              <p className="text-gray-700">
                회사의 중요시설에 대해 비인가자의 출입을 금하고 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 7. 개인정보 보호책임자 및 권익침해 구제방법 */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            7. 개인정보 보호책임자 및 권익침해 구제방법
          </h2>
          <p className="mb-6 text-gray-700">
            홈페이지 등을 이용하시는 과정에서 개인정보보호 관련 문의, 불만,
            조언이나 기타 사항은 개인정보보호책임자 및 담당부서로 연락해 주시기
            바랍니다. 여러분의 목소리에 귀 기울이고 신속하고 충분한 답변을 드릴
            수 있도록 최선을 다하겠습니다.
          </p>

          <div className="mb-6 rounded-lg bg-blue-50 p-6">
            <h3 className="mb-3 font-semibold text-gray-900">
              7.1 개인정보보호책임자
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>
                <strong>성명:</strong> 안영준
              </li>
              <li>
                <strong>직책:</strong> 공동대표
              </li>
              <li>
                <strong>이메일:</strong> sys.forbreeders@gmail.com
              </li>
            </ul>
          </div>

          <p className="mb-4 text-gray-700">
            또한, 개인정보가 침해되어 이에 대한 신고나 상담이 필요하신 경우에는
            아래 기관에 문의하셔서 도움을 받으실 수 있습니다.
          </p>

          <div className="space-y-3 rounded-lg bg-gray-50 p-6">
            <div>
              <p className="font-semibold text-gray-900">
                • 개인정보침해 신고센터
              </p>
              <p className="ml-4 text-gray-700">
                <a
                  href="https://privacy.kisa.or.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://privacy.kisa.or.kr
                </a>{' '}
                / (국번없이) 118
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                • 대검찰청 사이버수사과
              </p>
              <p className="ml-4 text-gray-700">
                <a
                  href="http://www.spo.go.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  http://www.spo.go.kr
                </a>{' '}
                / (국번없이) 1301
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                • 경찰청 사이버안전국
              </p>
              <p className="ml-4 text-gray-700">
                <a
                  href="https://cyberbureau.police.go.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://cyberbureau.police.go.kr
                </a>{' '}
                / (국번없이) 182
              </p>
            </div>
          </div>
        </section>

        {/* 8. 쿠키의 설치, 운영 및 그 거부에 관한 사항 */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            8. 쿠키의 설치, 운영 및 그 거부에 관한 사항
          </h2>
          <p className="mb-6 text-gray-700">
            웹기반 서비스의 제공을 위하여 쿠키를 이용하는 경우가 있습니다.
            &apos;쿠키(Cookie)&apos;는 보다 빠르고 편리한 웹 사이트 사용을
            지원하고 맞춤형 서비스를 제공하기 위해 사용됩니다.
          </p>

          <div className="mb-6 rounded-lg bg-gray-50 p-6">
            <h3 className="mb-3 font-semibold text-gray-900">8.1 쿠키란?</h3>
            <div className="space-y-3 text-gray-700">
              <p>
                • 웹사이트를 운영하는데 이용되는 서버가 이용자의 브라우저에
                보내는 아주 작은 텍스트 파일로서 이용자 컴퓨터에 저장됩니다.
              </p>
              <p>
                • 개인화되고 맞춤화된 서비스를 제공하기 위해서 이용자의 정보를
                저장하고 수시로 불러오는 쿠키를 사용합니다. 이용자가 웹사이트에
                방문할 경우 웹 사이트 서버는 이용자의 디바이스에 저장되어 있는
                쿠키의 내용을 읽어 이용자의 환경설정을 유지하고 맞춤화된
                서비스를 제공하게 됩니다. 쿠키는 이용자가 웹 사이트를 방문할 때,
                웹 사이트 사용을 설정한대로 접속하고 편리하게 사용할 수 있도록
                돕습니다. 또한, 이용자의 웹 사이트 방문 기록, 이용 형태를
                통해서 최적화된 광고 등 맞춤형 정보를 제공하기 위해 활용됩니다.
              </p>
              <p>
                • 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서
                이용자는 웹 브라우저에서 옵션을 설정함으로써 모든 쿠키를
                허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 모든 쿠키의
                저장을 거부할 수도 있습니다. 다만 쿠키 설치를 거부할 경우 웹
                사용이 불편해지며, 감사 추적 인증서 등 온라인 계약을 진행함에
                있어 회사의 포브리더스 개체 관리 서비스 서비스의 기능이 제대로
                동작하지 않을 수 있으며, 이와 관련하여 회사는 책임지지 않습니다.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-6">
            <h3 className="mb-3 font-semibold text-gray-900">
              8.2 쿠키 설정 거부 방법
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>
                • <strong>Internet Explorer의 경우:</strong> &quot;도구&quot; &gt;
                &quot;인터넷 옵션&quot; &gt; &quot;개인정보&quot; &gt; 직접 설정
              </li>
              <li>
                • <strong>Chrome의 경우:</strong> Chrome 맞춤설정 및 제어(웹
                브라우저 우측 상단) &gt; &quot;설정&quot; &gt; &quot;고급&quot;
                &gt; &quot;개인정보 및 보안&quot; 섹션의 &quot;콘텐츠
                설정&quot; &gt; 쿠키 섹션에서 직접 설정
              </li>
            </ul>
          </div>
        </section>

        {/* 9. 개인정보처리방침이 변경되는 경우 */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            9. 개인정보처리방침이 변경되는 경우
          </h2>
          <p className="mb-6 text-gray-700">
            현 개인정보처리방침 내용 추가, 삭제 및 수정이 있을 경우에는 시행하는
            날로부터 최소 7일전에 &apos;홈페이지(https://fobreeders.com)
            고객센터 내 공지사항&apos; 또는 &apos;이메일&apos;을 통해
            이용자에게 설명 드리겠습니다. 만약 이용자의 소중한 권리 또는 의무에
            관한 중요한 변경이 있을 경우에는 최소 30일 전에 미리 알려
            드리겠습니다.
          </p>

          <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-6">
            <div className="space-y-2 text-gray-900">
              <p>
                <strong>버전번호:</strong> 1.0
              </p>
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
