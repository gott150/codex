import type { Memory } from './Memory.js';

/** Vector store placeholder */
export class VectorStore implements Memory {
  async remember(_event: unknown): Promise<void> {}
  async recall(_query: unknown, _k: number): Promise<unknown[]> {
    return [];
  }
}
