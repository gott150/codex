import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function resolveDefaultFlow(cwd = process.cwd()): Promise<string> {
  const name = path.basename(cwd);
  const candidates = [
    'index.flow.yaml',
    'index.flow.yml',
    'codex.flow.yaml',
    'codex.flow.yml',
    `${name}.flow.yaml`,
    `${name}.flow.yml`,
  ];
  for (const c of candidates) {
    const p = path.join(cwd, c);
    try {
      await fs.access(p);
      return p;
    } catch {
      /* no file */
    }
  }
  const matches: string[] = [];
  async function walk(dir: string) {
    let entries: any[] = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.isFile() && /\.flow\.ya?ml$/.test(e.name)) matches.push(p);
    }
  }
  await walk(path.join(cwd, 'flows'));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) throw new Error(`Multiple flow files found: ${matches.join(', ')}`);
  throw new Error(`No flow file found in ${cwd}`);
}
