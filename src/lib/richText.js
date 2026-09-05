import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'a', 'blockquote', 'br', 'em', 'h2', 'h3', 'li', 'ol', 'p', 'strong', 'u', 'ul',
]

const ALLOWED_ATTR = ['href', 'rel', 'target']

export function sanitizeRichText(value) {
  if (!value) return ''

  return DOMPurify.sanitize(String(value), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  })
}

export function richTextToPlainText(value) {
  const html = sanitizeRichText(value)
  if (!html) return ''

  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const container = document.createElement('div')
  container.innerHTML = html
  return (container.textContent || '').replace(/\s+/g, ' ').trim()
}

export function normalizeRichText(value) {
  const html = sanitizeRichText(value)
  return richTextToPlainText(html) ? html : null
}
