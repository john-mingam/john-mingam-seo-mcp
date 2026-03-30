export type SchemaOrgType =
  | "Person"
  | "Organization"
  | "Product"
  | "Article"
  | "LocalBusiness"
  | "FAQPage"
  | "HowTo"
  | "BreadcrumbList"
  | "WebSite"
  | "WebPage"
  | "Event"
  | "Course"
  | "Recipe"
  | "VideoObject"
  | "Review"
  | "AggregateRating"
  | "Service"
  | "SoftwareApplication";

export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  richResultEligible: string[];
}
