import type { z } from "zod";

export interface ToolRegistration {
  name: string;
  description: string;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
  };
  inputSchema: z.ZodTypeAny;
  outputSchema?: z.ZodTypeAny;
  execute: (input: unknown) => Promise<{ structuredContent: Record<string, unknown>; content: string }>;
}
