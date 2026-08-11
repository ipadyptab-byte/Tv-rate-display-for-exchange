import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "./_app.js";

const appPromise = createApp().catch((err) => {
  console.error("Failed to initialize express app in Vercel function:", err);
  return null;
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await appPromise;
    if (!app) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Failed to initialize server application" }));
      return;
    }
    return app(req as any, res as any);
  } catch (err: any) {
    console.error("Vercel handler error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err?.message || "Internal server error" }));
  }
}
