import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useState } from 'react'

export interface ParentInfo {
  id: string
  name: string | null
  uniqueId: string
  gender: string
  imageUrl?: string
  speciesName?: string
  morphName?: string
}

interface ParentListProps {
  parents: ParentInfo[]
  onRemove: (uniqueId: string) => void
  emptyMessage: string
}

export function ParentList({ parents, onRemove, emptyMessage }: ParentListProps) {
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    name: string
    uniqueId: string
  } | null>(null)

  if (parents.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {parents.map((parent) => (
          <div
            key={parent.uniqueId}
            className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
          >
            {parent.imageUrl && (
              <img
                src={parent.imageUrl}
                alt={parent.name || parent.uniqueId}
                className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() =>
                  setSelectedImage({
                    url: parent.imageUrl!,
                    name: parent.name || parent.uniqueId,
                    uniqueId: parent.uniqueId,
                  })
                }
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {parent.name || parent.uniqueId}
              </p>
              <p className="text-xs text-gray-600">{parent.uniqueId}</p>
              {(parent.speciesName || parent.morphName) && (
                <p className="text-xs text-gray-500">
                  {[parent.speciesName, parent.morphName].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(parent.uniqueId)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}
