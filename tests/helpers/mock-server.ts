export interface RegisteredTool {
  name: string;
  meta: { description: string; inputSchema: Record<string, unknown>; annotations?: Record<string, unknown> };
  handler: (input: Record<string, unknown>) => Promise<{ structuredContent: Record<string, unknown>; content: Array<{ type: string; text: string }> }>;
}

export class MockMcpServer {
  public readonly tools = new Map<string, RegisteredTool>();

  public registerTool(
    name: string,
    meta: { description: string; inputSchema: Record<string, unknown>; annotations?: Record<string, unknown> },
    handler: RegisteredTool["handler"]
  ): void {
    this.tools.set(name, { name, meta, handler });
  }
}
