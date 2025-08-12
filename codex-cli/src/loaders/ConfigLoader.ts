import { promises as fs } from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

interface LoadConfigOpts {
  profile?: string;
  flowFile?: string;
  configRoot?: string;
}

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function loadConfig(opts: LoadConfigOpts = {}): Promise<Record<string, unknown>> {
  const profile = opts.profile ?? 'local';
  const roots: string[] = [];
  if (opts.flowFile) roots.push(path.dirname(path.resolve(opts.flowFile)));
  if (opts.configRoot) roots.push(path.resolve(opts.configRoot));
  roots.push(process.cwd());
  for (const r of roots) {
    const basePath = path.join(r, 'config/settings.yaml');
    if (await exists(basePath)) {
      const base = yaml.parse(await fs.readFile(basePath, 'utf8')) ?? {};
      let prof = {};
      const profilePath = path.join(r, `config/profiles/${profile}.yaml`);
      try {
        prof = yaml.parse(await fs.readFile(profilePath, 'utf8')) ?? {};
      } catch {
        /* no profile */
      }
      return { ...base, ...prof, ...process.env };
    }
  }
  return { ...process.env };
}
