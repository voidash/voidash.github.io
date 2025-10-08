'use client'

import { useRouter } from 'next/navigation'

type NotionPageClientProps = {
  blocks: any[]
}

export default function NotionPageClient({ blocks }: NotionPageClientProps) {
  const router = useRouter()

  const handlePageClick = (pageId: string) => {
    router.push(`/notion/${pageId}`)
  }

  if (blocks.length === 0) {
    return <p>No content available</p>
  }

  const renderBlock = (block: any) => {
    const { type, id } = block
    const value = block[type]

    switch (type) {
      case 'paragraph':
        return (
          <p key={id}>
            {value.rich_text?.map((text: any, i: number) => {
              const content = text.plain_text
              if (text.href) {
                return <a key={i} href={text.href}>{content}</a>
              }
              if (text.annotations?.bold) {
                return <strong key={i}>{content}</strong>
              }
              if (text.annotations?.italic) {
                return <em key={i}>{content}</em>
              }
              if (text.annotations?.code) {
                return <code key={i}>{content}</code>
              }
              return <span key={i}>{content}</span>
            })}
          </p>
        )

      case 'heading_1':
        return (
          <h1 key={id}>
            {value.rich_text?.map((text: any) => text.plain_text).join('')}
          </h1>
        )

      case 'heading_2':
        return (
          <h2 key={id}>
            {value.rich_text?.map((text: any) => text.plain_text).join('')}
          </h2>
        )

      case 'heading_3':
        return (
          <h3 key={id}>
            {value.rich_text?.map((text: any) => text.plain_text).join('')}
          </h3>
        )

      case 'bulleted_list_item':
        return (
          <li key={id}>
            {value.rich_text?.map((text: any) => text.plain_text).join('')}
          </li>
        )

      case 'numbered_list_item':
        return (
          <li key={id}>
            {value.rich_text?.map((text: any) => text.plain_text).join('')}
          </li>
        )

      case 'image':
        const imageUrl = value.file?.url || value.external?.url
        return imageUrl ? (
          <img key={id} src={imageUrl} alt="Notion image" style={{ maxWidth: '100%' }} />
        ) : null

      case 'code':
        return (
          <pre key={id}>
            <code>{value.rich_text?.map((text: any) => text.plain_text).join('')}</code>
          </pre>
        )

      case 'quote':
        return (
          <blockquote key={id}>
            {value.rich_text?.map((text: any) => text.plain_text).join('')}
          </blockquote>
        )

      case 'divider':
        return <hr key={id} />

      case 'child_page':
        return (
          <div
            key={id}
            style={{
              cursor: 'pointer',
              textDecoration: 'underline',
              color: '#0066cc',
              margin: '8px 0'
            }}
            onClick={(e) => {
              e.preventDefault()
              handlePageClick(id)
            }}
          >
            📄 {value.title}
          </div>
        )

      case 'toggle':
        return (
          <details key={id} style={{ margin: '8px 0' }}>
            <summary style={{ cursor: 'pointer', fontWeight: '500' }}>
              {value.rich_text?.map((text: any) => text.plain_text).join('')}
            </summary>
            <div style={{ paddingLeft: '20px', marginTop: '8px' }}>
              {block.children?.map((child: any) => renderBlock(child))}
            </div>
          </details>
        )

      case 'link_to_page':
        const pageId = value.page_id || value.database_id
        return pageId ? (
          <div
            key={id}
            style={{
              cursor: 'pointer',
              textDecoration: 'underline',
              color: '#0066cc',
              margin: '8px 0'
            }}
            onClick={(e) => {
              e.preventDefault()
              handlePageClick(pageId)
            }}
          >
            🔗 Link to page
          </div>
        ) : null

      default:
        return (
          <div key={id} style={{ color: '#888', fontSize: '0.9em', margin: '8px 0' }}>
            Unsupported block type: {type}
          </div>
        )
    }
  }

  return (
    <div className="notion-content" style={{ lineHeight: '1.6', fontSize: '16px' }}>
      {blocks.map((block) => renderBlock(block))}
    </div>
  )
}
