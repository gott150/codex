import { promises as fs } from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

export async function loadConfig(profile = 'local'): Promise<Record<string, unknown>> {
  const basePath = path.resolve('config/settings.yaml');
  const profilePath = path.resolve(`config/profiles/${profile}.yaml`);
  const base = yaml.parse(await fs.readFile(basePath, 'utf8')) ?? {};
  let prof = {};
  try {
    prof = yaml.parse(await fs.readFile(profilePath, 'utf8')) ?? {};
  } catch {
    /* ignore missing profile */
  }
  return { ...base, ...prof };
}
