// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
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

  it('marks only the games module as disabled', () => {
    render(<HomePage />);

    expect(screen.getByTestId('home-module-devices').getAttribute('aria-disabled')).toBe('false');
    expect(screen.getByTestId('home-module-games').getAttribute('aria-disabled')).toBe('true');
    expect(screen.getAllByText('即将上线')).toHaveLength(1);
  });

  it('offers one clear first-step action from the hero', () => {
    render(<HomePage />);

    expect(screen.getByTestId('home-hero')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /先看一个模拟/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /开启实验探索/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/experiments');
  });

  it('navigates to the module route when a card is clicked', () => {
    render(<HomePage />);

    fireEvent.click(screen.getByTestId('home-module-demos'));
    expect(mockNavigate).toHaveBeenLastCalledWith('/demos');

    fireEvent.click(screen.getByTestId('home-module-devices'));
    expect(mockNavigate).toHaveBeenLastCalledWith('/devices');

    fireEvent.click(screen.getByTestId('home-module-lab'));
    expect(mockNavigate).toHaveBeenLastCalledWith('/lab/explore');

    fireEvent.click(screen.getByTestId('home-module-gallery'));
    expect(mockNavigate).toHaveBeenLastCalledWith('/gallery');
  });
});
