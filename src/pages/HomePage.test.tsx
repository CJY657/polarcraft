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

  it('uses the requested Coolors palette for module cards', () => {
    render(<HomePage />);

    const expectedClasses = [
      ['courses', 'bg-[#264653]'],
      ['applications', 'bg-[#2a9d8f]'],
      ['demos', 'bg-[#e9c46a]'],
      ['devices', 'bg-[#f4a261]'],
      ['gallery', 'bg-[#e76f51]'],
      ['lab', 'bg-[#264653]'],
    ];

    for (const [moduleId, className] of expectedClasses) {
      expect(screen.getByTestId(`home-module-${moduleId}`).className).toContain(className);
    }
  });

  it('opens the frontier applications module', () => {
    render(<HomePage />);

    for (const moduleId of ['courses', 'applications', 'demos', 'devices', 'gallery', 'lab']) {
      expect(screen.getByTestId(`home-module-${moduleId}`).getAttribute('aria-disabled')).toBe('false');
    }

    expect(screen.queryByText('即将上线')).toBeNull();

    fireEvent.click(screen.getByTestId('home-module-applications'));
    expect(mockNavigate).toHaveBeenCalledWith('/applications');
  });

  it('replaces the quiz reminder with the prominent learning pulse entry', () => {
    render(<HomePage />);

    expect(screen.queryByText('偏振光学知识测验')).toBeNull();
    expect(screen.queryByRole('button', { name: /去测验/ })).toBeNull();

    const pulseEntry = screen.getByTestId('home-pulse-teaser');
    expect(pulseEntry.textContent).toContain('平台学习热度');
    expect(pulseEntry.textContent).toContain('数据每 10 分钟更新一次');
    expect(pulseEntry.className).toContain('bg-[#264653]');

    fireEvent.click(pulseEntry);
    expect(mockNavigate).toHaveBeenCalledWith('/pulse');
  });

  it('offers one clear first-step action from the CTA band', () => {
    render(<HomePage />);

    expect(screen.queryByRole('button', { name: /先看一个模拟/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /开启实验之旅/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/experiments');
  });

  it('navigates to the module route when a card is clicked', () => {
    render(<HomePage />);

    fireEvent.click(screen.getByTestId('home-module-courses'));
    expect(mockNavigate).toHaveBeenLastCalledWith('/experiments');

    fireEvent.click(screen.getByTestId('home-module-applications'));
    expect(mockNavigate).toHaveBeenLastCalledWith('/applications');

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
