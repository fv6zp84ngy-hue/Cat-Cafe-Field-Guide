import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import './Book.css'

export type BookPage = { id: string; content: ReactNode }
export type BookHandle = { goToPage: (id: string) => void }
export type BookBackdrop = 'dark' | 'desk' | 'cream'

interface Props {
  pages: BookPage[]
  initialPage?: number
  adminToolbar?: ReactNode
  backdrop?: BookBackdrop
}

const FLIP_MS = 850

const Book = forwardRef<BookHandle, Props>(function Book({ pages, initialPage = 0, adminToolbar, backdrop = 'dark' }, ref) {
  const [current, setCurrent] = useState(initialPage)
  const [isAnimating, setIsAnimating] = useState(false)
  const animatingRef = useRef(false)

  const go = useCallback((target: number) => {
    if (animatingRef.current) return
    if (target < 0 || target >= pages.length || target === current) return
    animatingRef.current = true
    setIsAnimating(true)
    setCurrent(target)
    window.setTimeout(() => {
      animatingRef.current = false
      setIsAnimating(false)
    }, FLIP_MS)
  }, [current, pages.length])

  const next = useCallback(() => go(current + 1), [go, current])
  const prev = useCallback(() => go(current - 1), [go, current])

  useImperativeHandle(ref, () => ({
    goToPage: (id: string) => {
      const idx = pages.findIndex(p => p.id === id)
      if (idx >= 0) go(idx)
    },
  }), [pages, go])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  useEffect(() => {
    let lastWheel = 0
    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, [contenteditable="true"], [data-scroll-area="true"]')) return
      const now = Date.now()
      if (now - lastWheel < 700 || Math.abs(e.deltaY) < 18) return
      lastWheel = now
      e.preventDefault()
      if (e.deltaY > 0) next()
      else prev()
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [next, prev])

  const total = pages.length

  return (
    <div
      className={`book book--backdrop-${backdrop}${isAnimating ? ' is-animating' : ''}`}
      role="region"
      aria-label="Cat Cafe Field Guide book"
    >
      <div className="book-stage">
        <div className="magazine">
          {pages.map((page, i) => {
            const flipped = i < current
            const isUnderneath = i === current + 1
            return (
              <div
                key={page.id}
                className={`book-page${flipped ? ' book-page--flipped' : ''}`}
                style={{ zIndex: total - i }}
                aria-hidden={i !== current}
              >
                <div className="book-page__face book-page__face--front">
                  {page.content}
                  {isUnderneath && <div className="book-cast-shadow" />}
                  <div className="book-page__face-shade" />
                </div>
                <div className="book-page__face book-page__face--back" />
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        className="book-nav book-nav--prev"
        onClick={prev}
        disabled={current === 0}
        aria-label="Previous page"
      />
      <button
        type="button"
        className="book-nav book-nav--next"
        onClick={next}
        disabled={current >= total - 1}
        aria-label="Next page"
      />

      <span className="book-indicator">
        {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>

      {adminToolbar && <div className="book-admin-toolbar">{adminToolbar}</div>}
    </div>
  )
})

export default Book
