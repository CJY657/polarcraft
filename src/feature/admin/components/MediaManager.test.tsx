// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaManager } from './MediaManager';
import type { MainSlide } from '@/lib/course.service';

const mockDeleteMedia = vi.fn();
const mockDeleteMediaBatch = vi.fn();

const mockStore = {
  currentCourse: {
    id: 'course-1',
    knowledgeTag: 'foundation',
    experimentCategories: [{ id: 'custom', name: { 'zh-CN': 'Custom files' } }],
    mainSlide: undefined as MainSlide | undefined,
    media: [
      {
        id: 'media-1',
        type: 'image' as const,
        url: '/uploads/1.png',
        title: { 'zh-CN': '图片一' },
        sortOrder: 0,
      },
      {
        id: 'media-2',
        type: 'video' as const,
        url: '/uploads/2.mp4',
        title: { 'zh-CN': '视频二' },
        sortOrder: 1,
      },
    ],
    hyperlinks: [],
  },
  deleteMedia: mockDeleteMedia,
  deleteMediaBatch: mockDeleteMediaBatch,
  reorderMedia: vi.fn(),
  upsertMainSlide: vi.fn(),
  fetchCourse: vi.fn(),
  isLoading: false,
  error: null,
};

vi.mock('@/stores/courseAdminStore', () => ({
  useCourseAdminStore: () => mockStore,
}));

vi.mock('./MediaFormDialog', () => ({
  MediaFormDialog: () => null,
}));

vi.mock('./BatchMediaUploadDialog', () => ({
  BatchMediaUploadDialog: () => null,
}));

describe('MediaManager', () => {
  beforeEach(() => {
    mockDeleteMedia.mockReset();
    mockDeleteMediaBatch.mockReset();
    mockDeleteMedia.mockResolvedValue(undefined);
    mockDeleteMediaBatch.mockResolvedValue(undefined);
    mockStore.currentCourse.knowledgeTag = 'foundation';
    mockStore.currentCourse.mainSlide = undefined;
    mockStore.upsertMainSlide.mockReset();
  });

  it('supports selecting all media and batch deleting them', async () => {
    render(<MediaManager courseId="course-1" unitId="unit-1" />);

    fireEvent.click(screen.getByRole('button', { name: '全选' }));

    expect(screen.getByText('已选中 2 个媒体资源')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '批量删除' }));
    fireEvent.click(screen.getByRole('button', { name: '删除' }));

    await waitFor(() => {
      expect(mockDeleteMediaBatch).toHaveBeenCalledWith(['media-1', 'media-2']);
    });
  });

  it('can delete a single selected media through the shared confirmation dialog', async () => {
    render(<MediaManager courseId="course-1" unitId="unit-1" />);

    fireEvent.click(screen.getByLabelText('选择媒体 图片一'));
    fireEvent.click(screen.getByRole('button', { name: '批量删除' }));
    fireEvent.click(screen.getByRole('button', { name: '删除' }));

    await waitFor(() => {
      expect(mockDeleteMedia).toHaveBeenCalledWith('media-1');
    });
    expect(mockDeleteMediaBatch).not.toHaveBeenCalled();
  });

  it('manages categories inside the experiment and assigns its main PDF', async () => {
    mockStore.currentCourse.mainSlide = { id: 'main', url: '/main.pdf', title: { 'zh-CN': 'Main PDF' }, knowledgeTag: 'foundation' };
    render(<MediaManager courseId="course-1" unitId="unit-1" />);
    expect(screen.getByRole('button', { name: '新建分类' })).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: '主课件文件分类' }), { target: { value: 'custom' } });
    await waitFor(() => expect(mockStore.upsertMainSlide).toHaveBeenCalledWith('course-1', expect.objectContaining({ url: '/main.pdf', experimentCategoryId: 'custom' })));
  });

  it('does not show file category controls for applications', () => {
    mockStore.currentCourse.knowledgeTag = 'optical_device';
    render(<MediaManager courseId="course-1" unitId="unit-1" />);
    expect(screen.queryByRole('button', { name: '新建分类' })).toBeNull();
    expect(screen.queryByRole('combobox', { name: '主课件文件分类' })).toBeNull();
  });
});
