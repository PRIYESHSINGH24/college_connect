import { describe, expect, it } from "vitest";
import { postSchema, projectSchema, resumeSchema } from "../src/lib/validators";

describe("request validators", () => {
  it("rejects empty posts and accepts bounded text", () => {
    expect(postSchema.safeParse({ body: " " }).success).toBe(false);
    expect(postSchema.safeParse({ body: "Shipping my first build", visibility: "campus" }).success).toBe(true);
  });
  it("rejects project descriptions below the minimum", () => {
    expect(projectSchema.safeParse({ title: "App", description: "short" }).success).toBe(false);
    expect(projectSchema.safeParse({ title: "Campus app", description: "A useful campus app with a clear goal." }).success).toBe(true);
  });
  it("requires a valid resume template", () => {
    expect(resumeSchema.safeParse({ title: "SDE Resume", template: "ats", content: {} }).success).toBe(true);
    expect(resumeSchema.safeParse({ title: "SDE Resume", template: "rainbow", content: {} }).success).toBe(false);
  });
});
