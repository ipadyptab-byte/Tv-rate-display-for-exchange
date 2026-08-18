import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./log";
import { getDatabaseUrl } from "./db";



export async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "â€¦";
        }

        log(logLine);
      }
    });

    next();
  });

  // Health check endpoint
  app.get("/api/health", async (_req, res) => {
    // Simple health check without database connection
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Quick diagnostics
  app.get("/api/debug/env", (_req, res) => {
    res.json({
      hasDatabaseUrl: Boolean(getDatabaseUrl()),
      nodeEnv: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
    });
  });

  app.get("/api/version", (_req, res) => {
    res.json({
      vercel: Boolean(process.env.VERCEL),
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
      buildTime: new Date().toISOString(),
    });
  });

  // Detailed database diagnostics
  await registerRoutes(app);

  // 404 handler for unmatched API routes so they return JSON, never HTML
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  if (process.env.VERCEL) {
    // Vercel serves static frontend files via CDN rewrites in vercel.json.
    // Serverless functions only need to handle API routes.
  } else if (process.env.NODE_ENV !== "production") {
    const { setupVite } = await import("./vite");
    await setupVite(app);
  } else {
    const { serveStatic } = await import("./vite");
    serveStatic(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message, error: err?.message });
  });

  return app;
}
