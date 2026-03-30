import nock from "nock";
import { describe, expect, it } from "vitest";
import { WordPressAdapter } from "../../src/adapters/wordpress.adapter.js";

describe("WordPressAdapter integration (mocked HTTP)", () => {
  it("connects and reads/updates a post", async () => {
    const adapter = new WordPressAdapter();

    await adapter.connect({
      platform: "wordpress",
      baseUrl: "https://wp.example.com",
      auth: { username: "admin", appPassword: "abcd efgh" }
    });

    nock("https://wp.example.com")
      .get("/wp-json/wp/v2/posts/42")
      .times(2)
      .reply(200, {
        id: 42,
        link: "https://wp.example.com/post-42",
        title: { rendered: "Post 42" },
        content: { rendered: "<p>Content 42</p>" },
        excerpt: { rendered: "<p>Excerpt 42</p>" },
        modified: "2026-03-30T00:00:00"
      });

    nock("https://wp.example.com")
      .post("/wp-json/wp/v2/posts/42")
      .reply(200, {
        id: 42,
        title: { rendered: "Updated title" },
        content: { rendered: "<p>Updated</p>" }
      });

    const page = await adapter.getPage("42");
    const update = await adapter.updatePage("42", { title: "Updated title" });

    expect(page.title).toBe("Post 42");
    expect(update.success).toBe(true);
    expect(update.id).toBe("42");
  });
});
