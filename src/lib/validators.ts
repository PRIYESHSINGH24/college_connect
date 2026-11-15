import { z } from "zod";
export const postSchema = z.object({ body: z.string().trim().min(1).max(5000), visibility: z.enum(["public", "campus", "followers"]).default("campus") });
export const projectSchema = z.object({ title: z.string().trim().min(3).max(120), description: z.string().trim().min(10).max(8000), tech_stack: z.array(z.string().trim().min(1).max(40)).max(20).default([]), repository_url: z.string().url().optional().or(z.literal("")), demo_url: z.string().url().optional().or(z.literal("")), openings: z.coerce.number().int().min(0).max(100).default(0), visibility: z.enum(["public", "campus", "private"]).default("campus") });
export const resumeSchema = z.object({ title: z.string().trim().min(1).max(100), template: z.enum(["ats", "modern", "compact"]), content: z.record(z.unknown()) });
export const messageSchema = z.object({ body: z.string().trim().min(1).max(10000), client_nonce: z.string().max(100).optional() });
export function jsonError(message: string, status = 400) { return Response.json({ error: message }, { status }); }
