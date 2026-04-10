// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaManager } from './MediaManager';

const mockDeleteMedia = vi.fn();
const mockDeleteMediaBatch = vi.fn();

const mockStore = {
  currentCourse: {
    id: 'course-1',
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
});
