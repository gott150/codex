import type { Memory } from './Memory.js';

/** In-memory store placeholder */
export class InMemoryStore implements Memory {
  private store: unknown[] = [];

  async remember(event: unknown): Promise<void> {
    this.store.push(event);
  }

  async recall(_query: unknown, k: number): Promise<unknown[]> {
    return this.store.slice(-k);
  }
}
