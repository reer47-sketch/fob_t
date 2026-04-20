interface AnimalQRCodeProps {
  qrCodeDataUrl: string
}

export function AnimalQRCode({ qrCodeDataUrl }: AnimalQRCodeProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">QR 코드</h3>
      {qrCodeDataUrl ? (
        <img src={qrCodeDataUrl} alt="QR Code" className="w-full" />
      ) : (
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
          QR 코드 없음
        </div>
      )}
    </div>
  )
}
