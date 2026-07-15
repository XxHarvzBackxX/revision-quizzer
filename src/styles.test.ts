import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

describe('responsive and theme style contracts', () => {
  it('hard-bounds the RevisionWiki cover progress ring', () => {
    expect(css).toMatch(/\.revision-progress-orb\s*\{[^}]*height:168px[^}]*width:168px/);
    expect(css).toMatch(/\.revision-progress-orb\s*\{[^}]*height:140px[^}]*width:140px/);
    expect(css).toMatch(/\.revision-course-hero::before\s*\{[^}]*position:absolute/);
  });

  it('defines every selectable site theme and contrast overrides', () => {
    for (const theme of ['light', 'light-contrast', 'dark', 'dark-contrast', 'dark-purple', 'mint']) {
      expect(css).toContain(`:root[data-theme="${theme}"]`);
    }
    expect(css).toContain(':root[data-theme^="dark"] .revision-block.block-highlight.yellow');
    expect(css).toContain(':root[data-theme] .quick-check');
  });

  it('keeps primary, secondary, and accent text readable on every theme surface', () => {
    for (const theme of ['light', 'light-contrast', 'dark', 'dark-contrast', 'dark-purple', 'mint']) {
      const variables = themeVariables(theme);
      expect(contrast(variables['--theme-ink'], variables['--theme-paper']), `${theme} primary text`).toBeGreaterThanOrEqual(7);
      expect(contrast(variables['--theme-muted'], variables['--theme-paper']), `${theme} secondary text`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(variables['--theme-accent'], variables['--theme-paper']), `${theme} accent text`).toBeGreaterThanOrEqual(4.5);
    }
    expect(css).toContain('RevisionWiki semantic foregrounds');
    expect(css).toContain('--course-text-accent:color-mix');
  });
});

function themeVariables(theme: string): Record<string, string> {
  const block = css.match(new RegExp(`:root\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  return Object.fromEntries(Array.from(block.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g), (match) => [match[1], match[2]]));
}

function contrast(left: string, right: string): number {
  const first = luminance(left);
  const second = luminance(right);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function luminance(hex: string): number {
  const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
