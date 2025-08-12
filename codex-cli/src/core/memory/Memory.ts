/** Memory interface placeholder */
export interface Memory {
  remember(event: unknown): Promise<void>;
  recall(query: unknown, k: number): Promise<unknown[]>;
}
