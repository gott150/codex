/** LLM provider placeholder */
export interface LlmProvider {
  generate(prompt: string): Promise<string>;
}
