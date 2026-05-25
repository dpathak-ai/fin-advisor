export interface ExplanationResult {
  term: string;
  explanation: string;
  example: string;
}

export type AppState = "idle" | "loading" | "success" | "error" | "limit_exceeded";
