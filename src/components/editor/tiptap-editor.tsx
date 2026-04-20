import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import { Bold, Italic, Strikethrough } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { uploadImage } from '@/actions/common/upload-image'
import { toast } from 'sonner'
import { Toolbar } from './toolbar'

interface TiptapEditorProps {
  content: string
  onChange: (content: { html: string, json: any }) => void
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const [imageUrl, setImageUrl] = useState('')

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      StarterKit.configure({
        document: false,
        paragraph: false,
        text: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: '내용을 입력하세요... (드래그 앤 드롭으로 이미지 추가 가능)',
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:pointer-events-none',
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      BubbleMenuExtension,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange({ html: editor.getHTML(), json: editor.getJSON() })
    },
    immediatelyRender: false,
  })

  // 이미지 업로드 핸들러를 useEffect로 등록 (editor 인스턴스 사용을 위해)
  useEffect(() => {
    if (!editor) return

    const handleImageUpload = async (file: File, pos?: number) => {
        const toastId = toast.loading('이미지 업로드 중...')
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'blog-content')
    
        try {
            const result = await uploadImage(formData)
            
            if (result.success) {
                if (pos !== undefined) {
                    editor.chain().insertContentAt(pos, { type: 'image', attrs: { src: result.url } }).run()
                } else {
                    editor.chain().setImage({ src: result.url }).run()
                }
                toast.success('이미지가 업로드되었습니다.', { id: toastId })
            } else {
                toast.error(result.error || '이미지 업로드 실패', { id: toastId })
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('이미지 업로드 중 오류가 발생했습니다.', { id: toastId })
        }
    }

    editor.setOptions({
        editorProps: {
            attributes: {
                class: 'prose prose-stone dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-4 py-4',
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                  const file = event.dataTransfer.files[0]
                  if (file.type.startsWith('image/')) {
                    event.preventDefault()
                    const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
                    handleImageUpload(file, coordinates?.pos)
                    return true
                  }
                }
                return false
            },
            handlePaste: (view, event, slice) => {
                if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
                    const file = event.clipboardData.files[0]
                    if (file.type.startsWith('image/')) {
                        event.preventDefault()
                        handleImageUpload(file)
                        return true
                    }
                }
                return false
            }
        }
    })
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="relative w-full flex flex-col">
      <Toolbar editor={editor} />
      
      <div className="border border-t-0 border-input rounded-b-md bg-white dark:bg-zinc-950 min-h-[500px]">
        {/* 텍스트 드래그 시 나타나는 메뉴 (유지) */}
        {editor && (
            <BubbleMenu
                editor={editor}
                className="flex items-center gap-1 p-1 rounded-lg border bg-white shadow-lg dark:bg-zinc-800"
            >
                <Toggle
                size="sm"
                pressed={editor.isActive('bold')}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                className="h-8 w-8 p-0"
                >
                <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                size="sm"
                pressed={editor.isActive('italic')}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                className="h-8 w-8 p-0"
                >
                <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                size="sm"
                pressed={editor.isActive('strike')}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                className="h-8 w-8 p-0"
                >
                <Strikethrough className="h-4 w-4" />
                </Toggle>
            </BubbleMenu>
        )}

        <EditorContent editor={editor} />
      </div>
    </div>
  )
}