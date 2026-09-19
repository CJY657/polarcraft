// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createMedia: vi.fn(), updateMedia: vi.fn() }));
vi.mock('@/stores/courseAdminStore', () => ({ useCourseAdminStore: () => ({ ...mocks, isLoading: false, error: null }) }));
vi.mock('@/components/ui/FileUpload', () => ({ FileUpload: () => null }));
import { MediaFormDialog } from './MediaFormDialog';

const categories = [{ id: 'custom', name: { 'zh-CN': 'Custom files' } }];
const media = { id: 'file', type: 'image' as const, url: '/img.png', title: { 'zh-CN': 'Image' }, knowledgeTag: 'foundation' as const, experimentCategoryId: 'custom' };
beforeEach(() => vi.clearAllMocks());

it('loads and clears an existing file category without changing the file', async () => {
  const onClose = vi.fn();
  render(<MediaFormDialog isOpen onClose={onClose} mode="edit" media={media} categories={categories} />);
  const select = screen.getByRole('combobox', { name: '文件分类' });
  expect((select as HTMLSelectElement).value).toBe('custom');
  fireEvent.change(select, { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() => expect(mocks.updateMedia).toHaveBeenCalledWith('file', expect.objectContaining({ experimentCategoryId: null, url: '/img.png' })));
  expect(onClose).toHaveBeenCalled();
});

it('assigns a custom category when creating a file', async () => {
  render(<MediaFormDialog isOpen onClose={vi.fn()} mode="create" courseId="course-1" categories={categories} />);
  fireEvent.change(screen.getByPlaceholderText('媒体标题'), { target: { value: 'New image' } });
  fireEvent.change(screen.getByRole('combobox', { name: '文件分类' }), { target: { value: 'custom' } });
  fireEvent.click(screen.getByRole('button', { name: '添加' }));
  await waitFor(() => expect(mocks.createMedia).toHaveBeenCalledWith('course-1', expect.objectContaining({ experimentCategoryId: 'custom' })));
});

it('does not send category edits for application resources', async () => {
  render(<MediaFormDialog isOpen onClose={vi.fn()} mode="edit" media={media} courseKnowledgeTag="optical_device" />);
  expect(screen.queryByRole('combobox', { name: '文件分类' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() => expect(mocks.updateMedia).toHaveBeenCalled());
  expect(mocks.updateMedia.mock.calls[0][1]).not.toHaveProperty('experimentCategoryId');
});
