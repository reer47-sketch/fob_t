import {
  Briefcase,
  Package,
  Utensils,
  Users,
  Heart,
  Egg,
  LucideIcon,
  Settings,
  BarChart3,
  Calendar,
  CalendarRange,
  DollarSign,
  FileText,
  Image,
  Pencil,
} from "lucide-react"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  paid?: boolean
}

/**
 * 네비게이션 아이템 목록
 * nav-main.tsx와 client-layout-content.tsx에서 공용으로 사용
 */
export const navItems: NavItem[] = [
  // {
  //   title: "홈",
  //   url: "/dashboard",
  //   icon: Briefcase,
  // },
  {
    title: "개체 관리",
    url: "/animals",
    icon: Package,
  },
  {
    title: "피딩 기록",
    url: "/feedings",
    icon: Utensils,
  },
  {
    title: "피딩 캘린더",
    url: "/feeding-calendar",
    icon: Calendar,
  },
  {
    title: "브리딩 캘린더",
    url: "/calendar",
    icon: CalendarRange,
  },
  {
    title: "메이팅 관리",
    url: "/pairings",
    icon: Heart,
  },
  {
    title: "알 관리",
    url: "/incubation",
    icon: Egg,
  },
  {
    title: "고객 관리",
    url: "/customers",
    icon: Users,
  },
  {
    title: "판매이력 관리",
    url: "/sales",
    icon: DollarSign,
  },
  {
    title: "통계",
    url: "/stats",
    icon: BarChart3,
  },
  {
    title: "일괄 관리",
    url: "/bulk-manage",
    icon: Pencil,
    paid: true,
  },
]

/**
 * 추가 페이지 타이틀 매핑 (서브 페이지용)
 */
export const subPageTitles: Record<string, string> = {
  '/animals/register': '개체 등록',
  '/mobile/feeding': '피딩',
}

/**
 * 관리자 네비게이션 아이템 목록
 */
export const adminNavItems: NavItem[] = [
  {
    title: "유저 관리",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "코드 관리",
    url: "/admin/codes",
    icon: Settings,
  },
  {
    title: "블로그 관리",
    url: "/admin/blogs",
    icon: FileText,
  },
  {
    title: "배너 관리",
    url: "/admin/banners",
    icon: Image,
  },
]

/**
 * pathname으로 페이지 타이틀 조회
 */
export function getPageTitle(pathname: string): string {
  // 메인 네비게이션 아이템에서 찾기
  const navItem = navItems.find(item => item.url === pathname)
  if (navItem) {
    return navItem.title
  }

  // 서브 페이지에서 찾기
  return subPageTitles[pathname] || ''
}

/**
 * pathname으로 관리자 페이지 타이틀 조회
 */
export function getAdminPageTitle(pathname: string): string {
  // 관리자 네비게이션 아이템에서 찾기
  const navItem = adminNavItems.find(item => item.url === pathname)
  if (navItem) {
    return navItem.title
  }

  return ''
}
