import { Metadata } from 'next'
import { PublicAnimalDetail } from './_components/public-animal-detail'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GuestAnimalDetailPage({ params }: PageProps) {
  const { id } = await params

  return <PublicAnimalDetail animalId={id} />
}
