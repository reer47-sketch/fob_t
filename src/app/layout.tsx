import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner"
import { DeviceDetector } from "@/components/device-detector"
import { ThemeProvider } from "next-themes"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.fobreeders.com'),
  title: {
    default: '포브(FOB) - 도마뱀·파충류 개체관리 솔루션 | 포브리더스',
    template: '%s | 포브',
  },
  description:
    '포브(FOB)는 도마뱀, 파충류 브리더를 위한 개체관리 솔루션입니다. 분양, 브리딩, 급여, 고객 관리까지 한번에 해결하세요. by 포브리더스(Fobreeders)',
  keywords: [
    '포브',
    'fob',
    '포브리더스',
    'fobreeders',
    '도마뱀 개체관리',
    '파충류 개체관리',
    '도마뱀 분양',
    '파충류 분양',
    '도마뱀 브리딩',
    '파충류 브리딩',
    '렙타일 관리',
    '파충류 샵 관리',
    '도마뱀 샵',
    '파충류 브리더',
    '도마뱀 브리더',
    '크레스티드 게코',
    '레오파드 게코',
    '볼파이톤',
    '개체관리 프로그램',
    '브리더 솔루션',
  ],
  icons: {
    icon: '/icon-logo.jpeg',
    apple: '/icon-logo.jpeg',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://www.fobreeders.com',
    siteName: '포브 FOB',
    title: '포브(FOB) - 도마뱀·파충류 개체관리 솔루션',
    description:
      '포브 - 도마뱀, 파충류 브리더를 위한 개체관리 솔루션. 분양, 브리딩, 급여, 고객 관리까지 한번에.',
    images: [
      {
        url: '/icon-logo.jpeg',
        width: 512,
        height: 512,
        alt: '포브 로고',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: '포브(FOB) - 도마뱀·파충류 개체관리 솔루션',
    description:
      '포브 - 도마뱀, 파충류 브리더를 위한 개체관리 솔루션. 분양, 브리딩, 급여, 고객 관리까지 한번에.',
    images: ['/icon-logo.jpeg'],
  },
  verification: {
    google: undefined, // Google Search Console 인증 코드 추가 필요 시
    other: {
      'naver-site-verification': 'naver6f163b446c4769849b341132182ed4b8',
    },
  },
  alternates: {
    canonical: 'https://www.fobreeders.com',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="data-theme" defaultTheme="green" themes={['green', 'black', 'pink', 'orange', 'violet', 'blue']} enableSystem={false} storageKey="fob-theme">
          <DeviceDetector />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
