// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { list, deleteFeedback } = vi.hoisted(() => ({
  list: vi.fn(),
  deleteFeedback: vi.fn(),
}));

vi.mock('@/lib/feedback.service', () => ({
  feedbackApi: {
    list,
    deleteFeedback,
  },
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('@/components/shared/PersistentHeader', () => ({
  PersistentHeader: ({ moduleName }: { moduleName?: string }) => <div>{moduleName}</div>,
}));

import AdminFeedbackPage from './AdminFeedbackPage';

const experimentFeedback = {
  id: 'feedback-1',
  category: 'experiment' as const,
  subject: '偏振实验说明有误',
  content: '第三步说明与页面操作不一致。',
  course_id: 'course-1',
  course_title: '偏振实验',
  source_page: '实验详情',
  page_path: '/experiments/polarization',
  contact_name: '林同学',
  contact_email: 'lin@example.com',
  image_url: null,
  user_id: 'user-1',
  username: 'lin',
  user_role: 'user' as const,
  ip_address: null,
  user_agent: null,
  created_at: '2026-07-30T08:00:00.000Z',
};

const productFeedback = {
  ...experimentFeedback,
  id: 'feedback-2',
  category: 'product' as const,
  subject: '建议优化导航',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminFeedbackPage />
    </MemoryRouter>
  );
}

describe('AdminFeedbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    list.mockResolvedValue({
      items: [experimentFeedback, productFeedback],
      total: 2,
    });
    deleteFeedback.mockResolvedValue(undefined);
  });

  it('shows the feedback subject in the irreversible confirmation and supports cancellation', async () => {
    renderPage();

    await screen.findByText(experimentFeedback.subject);
    expect(screen.getByRole('button', { name: `删除反馈“${productFeedback.subject}”` })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: `删除反馈“${experimentFeedback.subject}”` }));

    const dialog = await screen.findByRole('alertdialog', { name: '永久删除反馈？' });
    expect(within(dialog).getByText(/偏振实验说明有误/)).toBeDefined();
    expect(within(dialog).getByText(/此操作无法撤销/)).toBeDefined();

    fireEvent.click(within(dialog).getByRole('button', { name: '取消' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(deleteFeedback).not.toHaveBeenCalled();
    expect(screen.getByText(experimentFeedback.subject)).toBeDefined();
  });

  it('disables confirmation while deleting and reloads the active filter after success', async () => {
    list
      .mockReset()
      .mockResolvedValueOnce({ items: [experimentFeedback], total: 1 })
      .mockResolvedValueOnce({ items: [experimentFeedback], total: 1 })
      .mockResolvedValueOnce({ items: [], total: 0 });

    let resolveDelete: (() => void) | undefined;
    deleteFeedback.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        })
    );

    renderPage();
    await screen.findByText(experimentFeedback.subject);

    fireEvent.click(screen.getByRole('button', { name: '实验反馈' }));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith({ category: 'experiment', limit: 100 })
    );

    fireEvent.click(screen.getByRole('button', { name: `删除反馈“${experimentFeedback.subject}”` }));
    const dialog = await screen.findByRole('alertdialog', { name: '永久删除反馈？' });
    const confirmButton = within(dialog).getByRole('button', { name: '永久删除' });
    const cancelButton = within(dialog).getByRole('button', { name: '取消' });

    fireEvent.click(confirmButton);

    await waitFor(() => expect(deleteFeedback).toHaveBeenCalledWith('feedback-1'));
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true);
    expect((cancelButton as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      resolveDelete?.();
    });

    await waitFor(() => expect(list).toHaveBeenCalledTimes(3));
    expect(list).toHaveBeenLastCalledWith({ category: 'experiment', limit: 100 });
    await waitFor(() => expect(screen.queryByText(experimentFeedback.subject)).toBeNull());
  });

  it('retains the feedback card and shows the error when deletion fails', async () => {
    deleteFeedback.mockRejectedValue(new Error('删除请求失败'));
    renderPage();

    await screen.findByText(experimentFeedback.subject);
    fireEvent.click(screen.getByRole('button', { name: `删除反馈“${experimentFeedback.subject}”` }));
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '永久删除' }));

    expect(await screen.findByText('删除请求失败')).toBeDefined();
    expect(screen.getByText(experimentFeedback.subject)).toBeDefined();
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('shows a linked feedback image when the record includes one', async () => {
    list.mockResolvedValue({
      items: [{ ...experimentFeedback, image_url: '/uploads/courses/feedback/image/screenshot.png' }],
      total: 1,
    });

    renderPage();

    const link = await screen.findByRole('link', {
      name: `查看反馈“${experimentFeedback.subject}”的原图`,
    });
    expect(link.getAttribute('href')).toContain('/uploads/courses/feedback/image/screenshot.png');
    expect(screen.getByAltText(`反馈附件：${experimentFeedback.subject}`)).toBeDefined();
  });
});
