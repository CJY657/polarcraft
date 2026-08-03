// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchEducations: vi.fn(),
  fetchApplications: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'teacher-1',
      username: 'teacher',
      nickname: null,
      real_name: 'Lin Chen',
      show_real_name_publicly: false,
      role: 'user',
      user_type: 'teacher',
      avatar_url: null,
      email: 'teacher@example.com',
      email_verified: false,
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z',
      last_login_at: null,
    },
    refreshUser: vi.fn(),
  }),
}));

vi.mock('@/components/shared/PersistentHeader', () => ({
  PersistentHeader: () => <header />,
}));

vi.mock('@/feature/profile/components/EducationTimeline', () => ({
  EducationTimeline: () => null,
}));

vi.mock('@/feature/profile/components/ProfileEditDialog', () => ({
  ProfileEditDialog: () => null,
}));

vi.mock('@/feature/profile/components/PasswordChangeDialog', () => ({
  PasswordChangeDialog: () => null,
}));

vi.mock('@/stores/profileStore', () => ({
  useProfileStore: () => ({
    educations: [],
    applications: [],
    isLoading: false,
    error: null,
    fetchEducations: mocks.fetchEducations,
    addEducation: vi.fn(),
    updateEducation: vi.fn(),
    deleteEducation: vi.fn(),
    fetchApplications: mocks.fetchApplications,
    withdrawApplication: vi.fn(),
    clearError: vi.fn(),
  }),
}));

import ProfilePage from './ProfilePage';

describe('ProfilePage account identity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays the account user type separately from authorization role', () => {
    render(<ProfilePage />);

    expect(screen.getByText('账号身份：教师')).toBeDefined();
  });
});
