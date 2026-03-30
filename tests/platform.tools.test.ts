import { describe, expect, it } from "vitest";
import { platformSchemas } from "../src/tools/platform/index.js";

describe("Platform schema validation", () => {
  it("accepts WordPress multi-mode auth", () => {
    const jwtMode = platformSchemas.wp_page_seo_update.safeParse({
      wp_url: "https://example.com",
      credentials: { jwtToken: "token" },
      post_id: 1,
      seo_updates: {}
    });
    expect(jwtMode.success).toBe(true);

    const appPwdMode = platformSchemas.wp_page_seo_update.safeParse({
      wp_url: "https://example.com",
      credentials: { username: "admin", appPassword: "abcd efgh" },
      post_id: 1,
      seo_updates: {}
    });
    expect(appPwdMode.success).toBe(true);
  });

  it("rejects missing Shopify auth", () => {
    const parsed = platformSchemas.shopify_product_seo_update.safeParse({
      shop_domain: "shop.myshopify.com",
      credentials: {},
      product_id: "123",
      seo_updates: {}
    });

    expect(parsed.success).toBe(false);
  });
});
