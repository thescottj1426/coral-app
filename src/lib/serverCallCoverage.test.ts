import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Guards "every server call is logged". Adding an action or route without the
// wrapper fails here rather than failing silently in production.

const ROOT = join(__dirname, '..');

// Shared helper called inside nearly every action; wrapping it would report
// each failure twice.
const ALLOWED_UNTRACKED = new Set(['getCurrentUser']);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const sourceFiles = walk(ROOT).filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f));

/** Each exported action with the source text up to the next top-level export. */
function exportedActions(source: string): Array<{ name: string; text: string }> {
  const starts = [...source.matchAll(/^export async function (\w+)/gm)];
  return starts.map((m) => {
    const next = source.slice(m.index! + 1).search(/^export /m);
    const end = next === -1 ? source.length : m.index! + 1 + next;
    return { name: m[1], text: source.slice(m.index!, end) };
  });
}

describe('server call logging coverage', () => {
  const actionFiles = sourceFiles.filter((f) => /^'use server'/.test(readFileSync(f, 'utf8').trimStart()));

  it('finds the server action files', () => {
    expect(actionFiles.length).toBeGreaterThan(5);
  });

  it('wraps every exported server action in trackAction under its own name', () => {
    const missing: string[] = [];
    for (const file of actionFiles) {
      for (const { name, text } of exportedActions(readFileSync(file, 'utf8'))) {
        if (ALLOWED_UNTRACKED.has(name)) continue;
        if (!text.includes(`return trackAction('${name}',`)) missing.push(`${relative(ROOT, file)}: ${name}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('wraps every API route handler in withRoute', () => {
    const routes = sourceFiles.filter((f) => /[\\/]app[\\/]api[\\/].*[\\/]route\.ts$/.test(f));
    expect(routes.length).toBeGreaterThan(0);

    const missing: string[] = [];
    for (const file of routes) {
      const source = readFileSync(file, 'utf8');
      if (/^export (async function|const \{)/m.test(source)) {
        missing.push(`${relative(ROOT, file)}: exports a handler that is not wrapped`);
      }
      for (const [, method, rhs] of source.matchAll(/^export const (GET|POST|PUT|PATCH|DELETE)\s*=\s*(.+)$/gm)) {
        if (!rhs.startsWith('withRoute(')) missing.push(`${relative(ROOT, file)}: ${method}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
