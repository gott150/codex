import type { Memory } from './Memory.js';

/** SQLite store placeholder */
export class SqliteStore implements Memory {
  async remember(_event: unknown): Promise<void> {}
  async recall(_query: unknown, _k: number): Promise<unknown[]> {
    return [];
  }
}
