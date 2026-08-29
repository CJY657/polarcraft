// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { WebsiteUpdatesDropdown } from './WebsiteUpdatesDropdown';

const LAST_SEEN_STORAGE_KEY = 'polariscope.websiteUpdates.lastSeenId';
const NEWEST_ID = '2026-08-28-public-feedback-wall';

const ENTRIES: Array<[string, string]> = [
  ['公开反馈墙上线', '/feedback'],
  ['反馈支持附图', '/feedback'],
  ['沉浸式光学历史之旅', '/chronicles'],
  ['实验与应用目录焕新', '/experiments'],
  ['课题会议、AI 纪要与成员互评上线', '/lab/projects'],
];

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderDropdown() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <WebsiteUpdatesDropdown />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

const openPanel = () => fireEvent.click(screen.getByTitle('网站更新'));

describe('WebsiteUpdatesDropdown', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the dot until opened, then persists the newest id', () => {
    renderDropdown();

    expect(screen.getByRole('button', { name: '网站更新（有新内容）' })).toBeTruthy();

    openPanel();

    expect(screen.getByRole('button', { name: '网站更新' })).toBeTruthy();
    expect(localStorage.getItem(LAST_SEEN_STORAGE_KEY)).toBe(NEWEST_ID);
  });

  it('shows the dot again when a newer entry ships', () => {
    // 已看过的是旧条目 id / a stale stored id stands in for "a new first entry shipped"
    localStorage.setItem(LAST_SEEN_STORAGE_KEY, '2026-01-01-something-older');
    renderDropdown();

    expect(screen.getByRole('button', { name: '网站更新（有新内容）' })).toBeTruthy();
  });

  it('keeps the dot hidden once the newest id was seen', () => {
    localStorage.setItem(LAST_SEEN_STORAGE_KEY, NEWEST_ID);
    renderDropdown();

    expect(screen.getByRole('button', { name: '网站更新' })).toBeTruthy();
  });

  it('renders the entries newest-first', () => {
    renderDropdown();
    openPanel();

    const [first, second, third] = ENTRIES.map(([title]) => screen.getByText(title));
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(second.compareDocumentPosition(third) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('uses viewport edges on narrow screens and right alignment on larger screens', () => {
    renderDropdown();
    openPanel();

    const panel = screen.getByRole('region', { name: '网站更新' });
    expect(panel.className).toContain('fixed left-3 right-3');
    expect(panel.className).toContain('sm:absolute sm:left-auto sm:right-0');
  });

  it.each(ENTRIES)('navigates %s to %s and closes the panel', (title, path) => {
    renderDropdown();
    openPanel();

    fireEvent.click(screen.getByText(title));

    expect(screen.getByTestId('location').textContent).toBe(path);
    expect(screen.queryByText(title)).toBeNull();
  });

  it('closes on Escape and restores focus to the button', () => {
    renderDropdown();
    openPanel();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByText(ENTRIES[0][0])).toBeNull();
    expect(document.activeElement).toBe(screen.getByTitle('网站更新'));
  });

  it('closes when clicking outside', () => {
    renderDropdown();
    openPanel();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText(ENTRIES[0][0])).toBeNull();
  });
});
