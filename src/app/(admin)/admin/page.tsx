export default function AdminPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <img
          src="/top-logo.png"
          alt="POB Logo"
          className="mx-auto w-[200px] object-contain"
        />
        <h2 className="text-2xl font-semibold text-muted-foreground">
          관리자 페이지
        </h2>
        <p className="text-muted-foreground">
          왼쪽 메뉴에서 관리할 항목을 선택해주세요
        </p>
      </div>
    </div>
  )
}