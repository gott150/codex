import { promises as fs } from 'node:fs';
import path from 'node:path';

interface ResolveOpts {
  workspace: string;
  explicitPath?: string;
}

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function resolveFlow({ workspace, explicitPath }: ResolveOpts): Promise<string> {
  const root = path.resolve(workspace);
  if (explicitPath) {
    const p = path.resolve(root, explicitPath);
    if (!(await exists(p))) throw new Error(`Flow file not found: ${explicitPath}`);
    return p;
  }
  const names = [
    'index.flow',
    'codex.flow',
    `${path.basename(root)}.flow`,
  ];
  for (const n of names) {
    for (const ext of ['yaml', 'yml']) {
      const p = path.join(root, `${n}.${ext}`);
      if (await exists(p)) return p;
    }
  }
  const flowsDir = path.join(root, 'flows');
  let candidates: string[] = [];
  try {
    const files = await fs.readdir(flowsDir);
    candidates = files
      .filter((f) => f.endsWith('.flow.yaml') || f.endsWith('.flow.yml'))
      .map((f) => path.join(flowsDir, f));
  } catch {
    /* ignore */
  }
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    const rel = candidates.map((c) => path.relative(root, c)).join('\n');
    throw new Error(`Multiple flow files found:\n${rel}`);
  }
  throw new Error('No flow file found in workspace');
}

