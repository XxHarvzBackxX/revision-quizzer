import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

describe('responsive and theme style contracts', () => {
  it('hard-bounds the RevisionWiki cover progress ring', () => {
    expect(css).toMatch(/\.revision-progress-orb\s*\{[^}]*height:168px[^}]*width:168px/);
    expect(css).toMatch(/\.revision-progress-orb\s*\{[^}]*height:140px[^}]*width:140px/);
  });

  it('defines every selectable site theme and contrast overrides', () => {
    for (const theme of ['light', 'light-contrast', 'dark', 'dark-contrast', 'dark-purple', 'mint']) {
      expect(css).toContain(`:root[data-theme="${theme}"]`);
    }
    expect(css).toContain(':root[data-theme^="dark"] .revision-block.block-highlight.yellow');
    expect(css).toContain(':root[data-theme] .quick-check');
  });
});
