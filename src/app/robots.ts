import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/blog', '/blog/'],
        disallow: [
          '/admin',
          '/auth',
          '/guest',
          '/login',
          '/signup',
          '/dashboard',
          '/animals',
          '/breedings',
          '/pairings',
          '/incubation',
          '/feeding',
          '/sales',
          '/customers',
          '/settings',
          '/api',
          '/forgot-password',
          '/reset-password',
          '/pending',
          '/rejected',
          '/social-onboarding',
          '/privacy',
        ],
      },
    ],
    sitemap: 'https://www.fobreeders.com/sitemap.xml',
  }
}
