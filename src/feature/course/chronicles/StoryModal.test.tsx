// @vitest-environment jsdom

import { StrictMode, useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TimelineEvent } from '@/data/timeline-events'
import { StoryModal, type StoryModalProps } from './StoryModal'

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark' }),
}))

const event: TimelineEvent = {
  year: 1809,
  titleEn: 'Polarization',
  titleZh: 'Polarization story',
  descriptionEn: 'Description',
  descriptionZh: 'Description',
  category: 'discovery',
  importance: 1,
  track: 'polarization',
  story: { en: 'Full story', zh: 'Full story' },
  details: { en: ['Key fact'], zh: ['Key fact'] },
}

function renderModal(overrides: Partial<StoryModalProps> = {}) {
  const props = {
    event, onClose: vi.fn(), onNext: vi.fn(), onPrev: vi.fn(),
    hasNext: true, hasPrev: true, ...overrides,
  }
  const view = render(<MemoryRouter><StoryModal {...props} /></MemoryRouter>)
  return { ...view, props }
}

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

describe('StoryModal', () => {
  it('names the modal from its story heading and focuses the labelled close button', () => {
    renderModal()
    const dialog = screen.getByRole('dialog', { name: event.titleZh })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-labelledby')).toBe(screen.getByRole('heading', { level: 2 }).id)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '关闭故事' }))
    expect(screen.getByText('Full story')).toBeTruthy()
    expect(screen.getByText('Key fact')).toBeTruthy()
    expect(dialog.className).toContain('bg-slate-900')
  })

  it.each(['button', 'Escape', 'backdrop'])('restores focus and existing scroll style after %s closes it', method => {
    document.body.style.overflow = 'scroll'
    function Harness() {
      const [open, setOpen] = useState(false)
      return <>
        <button onClick={() => setOpen(true)}>Open story</button>
        {open && <StoryModal event={event} onClose={() => setOpen(false)} hasNext={false} hasPrev={false} />}
      </>
    }
    render(<StrictMode><MemoryRouter><Harness /></MemoryRouter></StrictMode>)
    const opener = screen.getByRole('button', { name: 'Open story' })
    opener.focus()
    fireEvent.click(opener)
    expect(document.body.style.overflow).toBe('hidden')
    const close = screen.getByRole('button', { name: '关闭故事' })
    if (method === 'button') fireEvent.click(close)
    else if (method === 'Escape') fireEvent.keyDown(close, { key: 'Escape' })
    else {
      const backdrop = screen.getByRole('dialog').previousElementSibling
      expect(backdrop).not.toBeNull()
      if (backdrop) fireEvent.click(backdrop)
    }
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('keeps focus and scroll locked when the story and callback props change', () => {
    const { rerender, unmount, props } = renderModal()
    const next = screen.getByRole('button', { name: '下一个' })
    next.focus()
    rerender(<MemoryRouter><StoryModal {...props} event={{ ...event, titleZh: 'Next story' }} onClose={vi.fn()} /></MemoryRouter>)
    expect(screen.getByRole('dialog', { name: 'Next story' })).toBeTruthy()
    expect(document.activeElement).toBe(next)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('wraps Tab in both directions while leaving interior tabbing native', () => {
    renderModal()
    const close = screen.getByRole('button', { name: '关闭故事' })
    const prev = screen.getByRole('button', { name: '上一个' })
    const next = screen.getByRole('button', { name: '下一个' })
    expect(fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })).toBe(false)
    expect(document.activeElement).toBe(next)
    expect(fireEvent.keyDown(next, { key: 'Tab' })).toBe(false)
    expect(document.activeElement).toBe(close)
    prev.focus()
    expect(fireEvent.keyDown(prev, { key: 'Tab' })).toBe(true)
  })

  it('excludes disabled and hidden controls and traps a single available button', () => {
    renderModal({ hasNext: false, hasPrev: false })
    const dialog = screen.getByRole('dialog')
    const hidden = document.createElement('button')
    hidden.hidden = true
    dialog.append(hidden)
    const close = screen.getByRole('button', { name: '关闭故事' })
    expect(fireEvent.keyDown(close, { key: 'Tab' })).toBe(false)
    expect(document.activeElement).toBe(close)
    expect(fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })).toBe(false)
    expect(document.activeElement).toBe(close)
    dialog.focus()
    fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(document.activeElement).toBe(close)
  })

  it('preserves navigation buttons and arrow shortcuts without scrolling', () => {
    const { props } = renderModal()
    const close = screen.getByRole('button', { name: '关闭故事' })
    expect(fireEvent.keyDown(close, { key: 'ArrowRight' })).toBe(false)
    expect(fireEvent.keyDown(close, { key: 'ArrowLeft' })).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: '下一个' }))
    fireEvent.click(screen.getByRole('button', { name: '上一个' }))
    expect(props.onNext).toHaveBeenCalledTimes(2)
    expect(props.onPrev).toHaveBeenCalledTimes(2)
  })

  it('does not navigate beyond either endpoint', () => {
    const { props } = renderModal({ hasNext: false, hasPrev: false })
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowRight' })
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowLeft' })
    fireEvent.click(screen.getByRole('button', { name: '下一个' }))
    fireEvent.click(screen.getByRole('button', { name: '上一个' }))
    expect(props.onNext).not.toHaveBeenCalled()
    expect(props.onPrev).not.toHaveBeenCalled()
  })

  it.each(['input', 'textarea', 'select', 'contenteditable', 'video'])('leaves arrows to %s controls', tag => {
    const { props } = renderModal()
    const control = document.createElement(tag === 'contenteditable' ? 'div' : tag)
    const target = document.createElement('span')
    if (tag === 'contenteditable') {
      control.setAttribute('contenteditable', 'true')
      control.append(target)
    }
    screen.getByRole('dialog').append(control)
    const source = tag === 'contenteditable' ? target : control
    expect(fireEvent.keyDown(source, { key: 'ArrowRight' })).toBe(true)
    expect(fireEvent.keyDown(source, { key: 'ArrowLeft' })).toBe(true)
    expect(props.onNext).not.toHaveBeenCalled()
    expect(props.onPrev).not.toHaveBeenCalled()
  })

  it.each([
    ['去演示馆体验', '/demos/malus'],
    ['在实验室复现', '/bench?experiment=malus-law'],
  ])('preserves the %s action', (label, destination) => {
    const onClose = vi.fn()
    function LocationProbe() {
      const location = useLocation()
      return <output>{location.pathname}{location.search}</output>
    }
    render(<MemoryRouter>
      <StoryModal event={{ ...event, illustrationType: 'polarizer' }} onClose={onClose} hasNext={false} hasPrev={false} />
      <LocationProbe />
    </MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: label }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.getByRole('status').textContent).toBe(destination)
  })

  it('keeps the mobile footer free of keyboard instructions and permits wrapping', () => {
    renderModal()
    const footer = screen.getByRole('button', { name: '上一个' }).parentElement
    expect(footer?.textContent).toBe('上一个下一个')
    expect(footer?.className).toContain('flex-wrap')
    expect(footer?.className).toContain('gap-2')
  })
})
