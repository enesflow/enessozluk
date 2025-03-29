export interface PerplexityCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  citations?: string[];
  choices: Array<{
    index: number;
    message: {
      role?: string;
      content: string;
    };
    finish_reason: null | "stop";
    delta: {
      content?: string;
    };
  }>;
}
