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
    t: (key: string) => {
      const translations: Record<string, string> = {
        'home.modules.courses.title': '经典实验',
        'home.modules.applications.title': '前沿应用',
        'home.modules.theory.title': '计算模拟',
        'home.modules.studio.title': '游戏化',
        'home.modules.gallery.title': '成果展示',
        'home.modules.lab.title': '虚拟课题组',
      };

      return translations[key] ?? key;
    },
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

  it('renders modules in the requested order with Chinese and English names', () => {
    render(<HomePage />);

    const moduleIds = screen
      .getAllByTestId(/^home-module-/)
      .map((module) => module.getAttribute('data-testid'));

    expect(moduleIds).toEqual([
      'home-module-courses',
      'home-module-applications',
      'home-module-demos',
      'home-module-devices',
      'home-module-gallery',
      'home-module-lab',
    ]);

    const expectedNames = [
      ['home-module-courses', '经典实验', 'Classic Experiments'],
      ['home-module-applications', '前沿应用', 'Frontier Applications'],
      ['home-module-demos', '计算模拟', 'Computational Simulation'],
      ['home-module-devices', '游戏化', 'Gamified Learning'],
      ['home-module-gallery', '成果展示', 'Achievement Showcase'],
      ['home-module-lab', '虚拟课题组', 'Virtual Research Group'],
    ];

    for (const [testId, chineseName, englishName] of expectedNames) {
      const cardText = screen.getByTestId(testId).textContent;

      expect(cardText).toContain(chineseName);
      expect(cardText).toContain(englishName);
    }
  });

  it('marks only the frontier applications module as disabled and blocks navigation', () => {
    render(<HomePage />);

    for (const moduleId of ['courses', 'demos', 'devices', 'gallery', 'lab']) {
      expect(screen.getByTestId(`home-module-${moduleId}`).getAttribute('aria-disabled')).toBe('false');
    }

    expect(screen.getByTestId('home-module-applications').getAttribute('aria-disabled')).toBe('true');
    expect(screen.getAllByText('即将上线')).toHaveLength(1);

    fireEvent.click(screen.getByTestId('home-module-applications'));
    expect(mockNavigate).not.toHaveBeenCalled();
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

    fireEvent.click(screen.getByTestId('home-module-courses'));
    expect(mockNavigate).toHaveBeenLastCalledWith('/experiments');

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
