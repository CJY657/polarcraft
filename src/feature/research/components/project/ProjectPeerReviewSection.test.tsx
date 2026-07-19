// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectReview } from '@/lib/research.service';
import { ProjectPeerReviewSection } from './ProjectPeerReviewSection';

const mockGetProjectReviews = vi.fn();
const mockUpsertMyProjectReview = vi.fn();
const mockDeleteProjectReview = vi.fn();
const mockGetPublicProjectReviews = vi.fn();

vi.mock('@/lib/research.service', () => ({
  researchApi: {
    getProjectReviews: (...args: unknown[]) => mockGetProjectReviews(...args),
    upsertMyProjectReview: (...args: unknown[]) => mockUpsertMyProjectReview(...args),
    deleteProjectReview: (...args: unknown[]) => mockDeleteProjectReview(...args),
  },
}));

vi.mock('@/lib/profile.service', () => ({
  profileApi: {
    getPublicProjectReviews: (...args: unknown[]) => mockGetPublicProjectReviews(...args),
  },
}));

function createReview(overrides: Partial<ProjectReview> = {}): ProjectReview {
  return {
    id: 'review-1',
    project_id: 'project-1',
    cycle_id: 'cycle-1',
    reviewer_id: 'reviewer-1',
    verdict: 'approve',
    content: '变量记录完整，结论有依据，建议通过。',
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
    reviewer_username: '评审同学',
    reviewer_avatar_url: null,
    ...overrides,
  };
}

describe('ProjectPeerReviewSection', () => {
  beforeEach(() => {
    mockGetProjectReviews.mockReset();
    mockUpsertMyProjectReview.mockReset();
    mockDeleteProjectReview.mockReset();
    mockGetPublicProjectReviews.mockReset();
  });

  it('shows review progress, criteria, and a member read-only hint', async () => {
    mockGetProjectReviews.mockResolvedValue([createReview()]);

    render(
      <ProjectPeerReviewSection
        projectId="project-1"
        projectStatus="review_pending"
        reviewCriteria="变量明确，证据完整"
        currentUserId="owner-1"
        isActiveMember
      />
    );

    expect(await screen.findByText('评审同学')).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();
    expect(screen.getByText('评审标准')).toBeTruthy();
    expect(screen.getByText('变量明确，证据完整')).toBeTruthy();
    expect(screen.getByText('已收到 1 份评审，还差 1 份。')).toBeTruthy();
    expect(
      screen.getByText('同伴评审由课题组外的同学提交，组内成员在这里查看收到的意见即可。')
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: /提交评审/ })).toBeNull();
  });

  it('lets a logged-in non-member submit a review', async () => {
    mockGetProjectReviews
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        createReview({ reviewer_id: 'visitor-1', verdict: 'request_changes', content: '建议补充对照组数据。' }),
      ]);
    mockUpsertMyProjectReview.mockResolvedValue(
      createReview({ reviewer_id: 'visitor-1', verdict: 'request_changes' })
    );

    render(
      <ProjectPeerReviewSection
        projectId="project-1"
        projectStatus="review_pending"
        currentUserId="visitor-1"
        isActiveMember={false}
      />
    );

    expect(await screen.findByText('还没有收到同伴评审')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: /建议修改/ }));
    fireEvent.change(screen.getByLabelText('评审意见'), {
      target: { value: '建议补充对照组数据。' },
    });
    fireEvent.click(screen.getByRole('button', { name: /提交评审/ }));

    await waitFor(() => {
      expect(mockUpsertMyProjectReview).toHaveBeenCalledWith('project-1', {
        verdict: 'request_changes',
        content: '建议补充对照组数据。',
      });
    });
    expect(await screen.findByText('建议补充对照组数据。', { selector: 'p' })).toBeTruthy();
    expect(screen.getByText('我的评审')).toBeTruthy();
    expect(screen.getByRole('button', { name: /更新评审/ })).toBeTruthy();
  });

  it('requires review content before submitting', async () => {
    mockGetProjectReviews.mockResolvedValue([]);

    render(
      <ProjectPeerReviewSection
        projectId="project-1"
        projectStatus="review_pending"
        currentUserId="visitor-1"
        isActiveMember={false}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: /提交评审/ }));

    expect(await screen.findByText('请填写评审意见')).toBeTruthy();
    expect(mockUpsertMyProjectReview).not.toHaveBeenCalled();
  });

  it('uses the public endpoint and shows a login hint for guests', async () => {
    mockGetPublicProjectReviews.mockResolvedValue([createReview()]);

    render(
      <ProjectPeerReviewSection
        projectId="project-1"
        projectStatus="review_pending"
        isActiveMember={false}
        usePublicEndpoint
      />
    );

    expect(await screen.findByText('评审同学')).toBeTruthy();
    expect(mockGetPublicProjectReviews).toHaveBeenCalledWith('project-1');
    expect(mockGetProjectReviews).not.toHaveBeenCalled();
    expect(screen.getByText('登录后就可以对照评审标准提交你的同伴评审。')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /提交评审/ })).toBeNull();
  });

  it('keeps historical reviews visible after showcase and reports content state', async () => {
    mockGetProjectReviews.mockResolvedValue([createReview()]);
    const onContentChange = vi.fn();

    render(
      <ProjectPeerReviewSection
        projectId="project-1"
        projectStatus="showcased"
        currentUserId="owner-1"
        isActiveMember
        onContentChange={onContentChange}
      />
    );

    expect(await screen.findByText('评审同学')).toBeTruthy();
    expect(screen.getByText('这些是课题在待评审阶段收到的同伴评审记录。')).toBeTruthy();
    expect(screen.queryByText('评审进度')).toBeNull();
    await waitFor(() => {
      expect(onContentChange).toHaveBeenLastCalledWith(true);
    });
  });

  it('renders nothing for showcased projects without reviews', async () => {
    mockGetProjectReviews.mockResolvedValue([]);
    const onContentChange = vi.fn();

    const { container } = render(
      <ProjectPeerReviewSection
        projectId="project-1"
        projectStatus="showcased"
        currentUserId="owner-1"
        isActiveMember
        onContentChange={onContentChange}
      />
    );

    await waitFor(() => {
      expect(onContentChange).toHaveBeenLastCalledWith(false);
    });
    expect(container.querySelector('section')).toBeNull();
  });
});
