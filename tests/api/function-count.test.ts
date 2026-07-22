import { readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const HOBBY_FUNCTION_LIMIT = 12;

describe('Vercel function layout', () => {
  it('keeps the deployment within the Hobby plan function limit', () => {
    const apiDirectory = resolve(process.cwd(), 'api');
    const functions = findFunctionFiles(apiDirectory)
      .map((file) => relative(apiDirectory, file).replaceAll('\\', '/'))
      .sort();

    expect(functions).toEqual([
      'account/[action].ts',
      'admin/config.ts',
      'admin/datasets/[id].ts',
      'admin/datasets/index.ts',
      'auth/[action].ts',
      'config.ts',
      'cron/retention.ts',
      'datasets/[id].ts',
      'datasets/index.ts'
    ]);
    expect(functions.length).toBeLessThanOrEqual(HOBBY_FUNCTION_LIMIT);
  });
});

function findFunctionFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findFunctionFiles(path);
    if (!entry.isFile() || !entry.name.endsWith('.ts') || entry.name.startsWith('_') || entry.name.endsWith('.d.ts')) return [];
    return [path];
  });
}
