import nock from "nock";
import { describe, expect, it } from "vitest";
import { ShopifyAdapter } from "../../src/adapters/shopify.adapter.js";

describe("ShopifyAdapter integration (mocked HTTP)", () => {
  it("connects and reads/updates a product", async () => {
    const adapter = new ShopifyAdapter();

    await adapter.connect({
      platform: "shopify",
      baseUrl: "shop.example.com",
      auth: { adminApiKey: "shpat_test" },
      apiVersion: "2024-10"
    });

    nock("https://shop.example.com")
      .get("/admin/api/2024-10/products/123.json")
      .times(2)
      .reply(200, {
        product: {
          id: 123,
          handle: "chair-ergonomic",
          title: "Chair",
          body_html: "<p>Comfort chair</p>",
          updated_at: "2026-03-30T00:00:00",
          status: "active"
        }
      });

    nock("https://shop.example.com")
      .put("/admin/api/2024-10/products/123.json")
      .reply(200, {
        product: {
          id: 123,
          title: "Chair Updated"
        }
      });

    const page = await adapter.getPage("123");
    const update = await adapter.updatePage("123", { title: "Chair Updated" });

    expect(page.id).toBe("123");
    expect(update.success).toBe(true);
  });
});
