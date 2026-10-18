// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getResourceById, type PolarizationResource } from '@/data/resource-gallery'
import { ResourceGallery } from './ResourceGallery'

vi.mock('@/data/resource-gallery', () => ({ getResourceById: vi.fn() }))

function resource(id: string, overrides: Partial<PolarizationResource> = {}): PolarizationResource {
  return {
    id, type: 'image', title: id, titleZh: `中文 ${id}`, url: `/${id}.jpg`,
    category: 'stress', relatedModules: [], metadata: {}, ...overrides,
  }
}

function linkResources(resources: PolarizationResource[]) {
  vi.mocked(getResourceById).mockImplementation(id => resources.find(item => item.id === id))
  return resources.map(item => item.id)
}

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe('ResourceGallery resource ordering', () => {
  it.each([false, true])('preserves image order, sequence fallbacks and captions (isZh=%s)', isZh => {
    const resourceIds = linkResources([
      resource('linked'),
      resource('sequence', { type: 'sequence', frames: [
        { time: 0, url: '/frame-1.jpg', label: 'Frame 1', labelZh: '帧 1' },
        { time: 1, url: '/frame-2.jpg', label: 'Frame 2', labelZh: '帧 2' },
      ] }),
      resource('empty-sequence', { type: 'sequence', frames: [] }),
      resource('fallback-sequence', { type: 'sequence' }),
    ])
    const { container } = render(<ResourceGallery theme="light" isZh={isZh} resources={{
      resourceIds: ['missing', ...resourceIds],
      featuredImages: [{ url: '/featured.jpg', caption: 'Featured', captionZh: '特色' }],
    }} />)
    const expected = [
      ['/featured.jpg', isZh ? '特色' : 'Featured'],
      ['/linked.jpg', isZh ? '中文 linked' : 'linked'],
      ['/frame-1.jpg', isZh ? '帧 1' : 'Frame 1'],
      ['/frame-2.jpg', isZh ? '帧 2' : 'Frame 2'],
      ['/fallback-sequence.jpg', isZh ? '中文 fallback-sequence' : 'fallback-sequence'],
    ]
    const thumbnails = Array.from(container.querySelectorAll('button img'))
    expect(thumbnails.map(img => img.getAttribute('src'))).toEqual(expected.map(([url]) => url))
    thumbnails.forEach((thumbnail, i) => {
      fireEvent.click(thumbnail)
      const [url, caption] = expected[i]
      expect(screen.getByRole('img', { name: caption }).getAttribute('src')).toBe(url)
      expect(screen.getByText(caption)).toBeTruthy()
    })
  })

  it.each([false, true])('preserves featured duplicates and linked-video precedence over metadata (isZh=%s)', isZh => {
    const resourceIds = linkResources([
      resource('metadata-first', { metadata: { videoUrl: '/linked.mp4' } }),
      resource('metadata-only', { metadata: { videoUrl: '/metadata.mp4' } }),
      resource('metadata-duplicate', { metadata: { videoUrl: '/metadata.mp4' } }),
      resource('featured-duplicate', { type: 'video', url: '/featured.mp4' }),
      resource('linked', { type: 'video', url: '/linked.mp4' }),
      resource('linked-duplicate', { type: 'video', url: '/linked.mp4' }),
    ])
    const { container } = render(<ResourceGallery theme="dark" isZh={isZh} resources={{
      resourceIds,
      featuredImages: [{ url: '/preview.jpg' }],
      featuredVideos: [
        { url: '/featured.mp4', title: 'Featured 1', titleZh: '特色 1' },
        { url: '/featured.mp4', title: 'Featured 2', titleZh: '特色 2' },
      ],
      featuredVideo: { url: '/ignored.mp4', title: 'Ignored' },
    }} />)
    fireEvent.click(screen.getByRole('button', { name: isZh ? '实验视频 (4)' : 'Experiment Videos (4)' }))
    const expected = [
      ['/featured.mp4', isZh ? '特色 1' : 'Featured 1'],
      ['/featured.mp4', isZh ? '特色 2' : 'Featured 2'],
      ['/linked.mp4', isZh ? '中文 linked' : 'linked'],
      ['/metadata.mp4', isZh ? '中文 metadata-only' : 'metadata-only'],
    ]
    expected.forEach(([url, title], i) => {
      fireEvent.click(screen.getByRole('button', { name: isZh ? `视频 ${i + 1}` : `Video ${i + 1}` }))
      expect(container.querySelector('video')?.getAttribute('src')).toBe(url)
      expect(screen.getByText(title)).toBeTruthy()
    })
  })

  it.each([undefined, []])('uses the singular featured video when the plural list is %j', featuredVideos => {
    const { container } = render(<ResourceGallery theme="light" isZh={false} resources={{
      featuredImages: [{ url: '/preview.jpg' }],
      featuredVideos,
      featuredVideo: { url: '/singular.mp4', title: 'Singular video' },
    }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Experiment Videos (1)' }))
    expect(container.querySelector('video')?.getAttribute('src')).toBe('/singular.mp4')
    expect(screen.getByText('Singular video')).toBeTruthy()
  })

  it('renders nothing when all linked resources are missing or empty sequences', () => {
    linkResources([resource('empty', { type: 'sequence', frames: [] })])
    const { container } = render(<ResourceGallery theme="light" isZh={false} resources={{
      resourceIds: ['missing', 'empty'],
    }} />)
    expect(container.innerHTML).toBe('')
  })
})
