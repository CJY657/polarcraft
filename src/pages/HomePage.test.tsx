// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HomePage } from './HomePage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light' as const,
  }),
}));

vi.mock('@/components/shared', () => ({
  PersistentHeader: () => <div data-testid="persistent-header" />,
}));

vi.mock('@/components/icons', () => {
  const StubIcon = () => <div aria-hidden="true" />;

  return {
    CoursesModuleIcon: StubIcon,
    DevicesModuleIcon: StubIcon,
    DemosModuleIcon: StubIcon,
    GamesModuleIcon: StubIcon,
    GalleryModuleIcon: StubIcon,
    LabModuleIcon: StubIcon,
  };
});

describe('HomePage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders module quick links without duplicate key warnings', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<HomePage />);

    const duplicateKeyWarnings = consoleErrorSpy.mock.calls.filter(([message]) =>
      String(message).includes('Encountered two children with the same key')
    );

    expect(duplicateKeyWarnings).toHaveLength(0);

    consoleErrorSpy.mockRestore();
  });

  it('marks unavailable modules as disabled', () => {
    render(<HomePage />);

    expect(screen.getByTestId('home-module-devices').getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByTestId('home-module-games').getAttribute('aria-disabled')).toBe('true');
    expect(screen.getAllByText('暂不开放')).toHaveLength(2);
  });
});
