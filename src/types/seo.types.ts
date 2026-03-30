import type { Platform } from "./platform.types.js";

export interface PriorityAction {
  priority: "critical" | "high" | "medium" | "low";
  action: string;
  reason: string;
}

export interface SFTScore {
  structure: {
    score: number;
    heading_hierarchy: boolean;
    schema_present: boolean;
    internal_links: number;
    issues: string[];
  };
  flow: {
    score: number;
    entity_prominence: number;
    semantic_density: number;
    content_freshness: number;
    issues: string[];
  };
  trust: {
    score: number;
    eeat_signals: number;
    external_references: number;
    author_entity: boolean;
    issues: string[];
  };
  total: number;
  grade: "A" | "B" | "C" | "D" | "F";
  priority_actions: PriorityAction[];
}

export interface NAPData {
  name: string;
  address: string;
  phone: string;
}

export interface SEOError {
  error: {
    code: string;
    message: string;
    suggestion: string;
    docs_url?: string;
  };
}

export interface ToolContext {
  readOnly: boolean;
  platform?: Platform;
}

export interface DateRange {
  from: string;
  to: string;
}
