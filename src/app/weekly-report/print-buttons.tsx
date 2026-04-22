'use client'

export function PrintButtons() {
  return (
    <div className="print:hidden fixed top-4 right-4 flex gap-2 z-10">
      <button
        onClick={() => window.print()}
        className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
      >
        인쇄 / PDF 저장
      </button>
      <button
        onClick={() => window.close()}
        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
      >
        닫기
      </button>
    </div>
  )
}
