import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const selectableThemes = [
  'light', 'light-contrast', 'dark', 'dark-contrast', 'dark-purple', 'mint',
  'pacific-blue', 'arcade-red', 'sunset-orange', 'solar-yellow', 'neon-pink'
];

describe('responsive and theme style contracts', () => {
  it('hard-bounds the RevisionWiki cover progress ring', () => {
    expect(css).toMatch(/\.revision-progress-orb\s*\{[^}]*height:168px[^}]*width:168px/);
    expect(css).toMatch(/\.revision-progress-orb\s*\{[^}]*height:140px[^}]*width:140px/);
    expect(css).toMatch(/\.revision-course-hero::before\s*\{[^}]*position:absolute/);
  });

  it('bounds the smart-study readiness indicator and adapts the drill layout', () => {
    expect(css).toMatch(/\.study-readiness-orb\s*\{[^}]*width:180px/);
    expect(css).toMatch(/\.study-readiness-orb\s*\{[^}]*width:118px/);
    expect(css).toContain('.study-dashboard-grid');
    expect(css).toContain('.confidence-picker');
  });

  it('defines every selectable site theme and contrast overrides', () => {
    for (const theme of selectableThemes) {
      expect(css).toContain(`:root[data-theme="${theme}"]`);
    }
    expect(css).toContain(':root[data-theme^="dark"] .revision-block.block-highlight.yellow');
    expect(css).toContain(':root[data-theme] .quick-check');
  });

  it('keeps primary, secondary, and accent text readable on every theme surface', () => {
    for (const theme of selectableThemes) {
      const variables = themeVariables(theme);
      expect(contrast(variables['--theme-ink'], variables['--theme-paper']), `${theme} primary text`).toBeGreaterThanOrEqual(7);
      expect(contrast(variables['--theme-muted'], variables['--theme-paper']), `${theme} secondary text`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(variables['--theme-accent'], variables['--theme-paper']), `${theme} accent text`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(variables['--theme-primary-text'], variables['--theme-primary']), `${theme} button text`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(variables['--theme-primary-text'], variables['--theme-accent']), `${theme} accent badge text`).toBeGreaterThanOrEqual(4.5);
    }
    expect(css).toContain('RevisionWiki semantic foregrounds');
    expect(css).toContain('--course-text-accent:color-mix');
  });

  it('provides responsive changelog history and a visible version footer', () => {
    expect(css).toContain('.site-footer');
    expect(css).toContain('.changelog-dialog');
    expect(css).toContain('.changelog-scroll');
    expect(css).toMatch(/\.changelog-sections section\s*\{[^}]*background:var\(--theme-soft,#f7f8fa\)[^}]*color:var\(--theme-ink,#172033\)/);
    expect(css).toMatch(/@media \(max-width:640px\)[\s\S]*\.changelog-dialog/);
  });

  it('defines every referenced theme token and themes inherited-text surfaces', () => {
    const referenced = new Set(Array.from(css.matchAll(/var\((--theme-[\w-]+)/g), (match) => match[1]));
    const defined = new Set(Array.from(css.matchAll(/(--theme-[\w-]+)\s*:/g), (match) => match[1]));
    expect([...referenced].filter((variable) => !defined.has(variable))).toEqual([]);
    expect(css).toContain(':is(.question-navigator,.submit-dialog) { background:var(--theme-paper)');
    expect(css).toContain(':is(.changelog-sections section,.submit-summary,.review-filters,.empty-inline) { background:var(--theme-soft)');
    expect(css).toContain('--theme-success-bg:color-mix');
    expect(css).toContain('--theme-warning-bg:color-mix');
    expect(css).toContain('--theme-danger-bg:color-mix');
  });

  it('gives official datasets a distinct purple approval seal', () => {
    expect(css).toMatch(/\.official-pill\s*\{[^}]*background:#eee8ff[^}]*border:1px solid #c4b5fd[^}]*color:#6d28d9/);
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
