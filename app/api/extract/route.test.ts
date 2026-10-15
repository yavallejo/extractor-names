import { describe, it, expect } from "vitest";
import { POST } from "./route";

const post = (body: string) =>
  POST(new Request("http://localhost/api/extract", { method: "POST", body }));

describe("POST /api/extract input validation", () => {
  it("returns 400 for a JSON null body instead of crashing", async () => {
    const res = await post("null");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid request." });
  });
  it("returns 400 for a JSON array body", async () => {
    expect((await post("[]")).status).toBe(400);
  });
  it("returns 400 for invalid JSON", async () => {
    expect((await post("{nope")).status).toBe(400);
  });
  it("returns 400 for a missing URL", async () => {
    expect((await post(JSON.stringify({ classes: "a" }))).status).toBe(400);
  });
  it("returns 400 for empty classes", async () => {
    expect((await post(JSON.stringify({ url: "https://a.com", classes: "  " }))).status).toBe(400);
  });
});
