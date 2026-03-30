import { z } from "zod";
import type { SchemaValidationResult, ValidationError } from "../types/schema.types.js";

const jsonLdBaseSchema = z.object({
  "@context": z.literal("https://schema.org"),
  "@type": z.string().min(1)
});

export function validateSchemaJsonLd(jsonld: unknown): SchemaValidationResult {
  let parsed: unknown = jsonld;

  if (typeof jsonld === "string") {
    try {
      parsed = JSON.parse(jsonld);
    } catch {
      return {
        valid: false,
        errors: [{ path: "$", message: "Invalid JSON string", severity: "error" }],
        warnings: [],
        richResultEligible: []
      };
    }
  }

  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const res = jsonLdBaseSchema.safeParse(parsed);

  if (!res.success) {
    for (const issue of res.error.issues) {
      errors.push({
        path: issue.path.join(".") || "$",
        message: issue.message,
        severity: "error"
      });
    }

    return { valid: false, errors, warnings, richResultEligible: [] };
  }

  const doc = parsed as Record<string, unknown>;
  if (!doc["@id"]) {
    warnings.push("Missing @id. Include canonical URL for disambiguation.");
  }
  if (!doc.sameAs) {
    warnings.push("Missing sameAs. Add trusted entity URIs for KG alignment.");
  }

  const eligible: string[] = [];
  const type = String(doc["@type"]);
  if (["FAQPage", "HowTo", "Product", "Article", "Event", "Recipe", "VideoObject"].includes(type)) {
    eligible.push(type);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    richResultEligible: eligible
  };
}
