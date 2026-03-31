import express, { Request, Response, NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import { getStore } from "../store";
import { config } from "../config";
import { logger } from "../logger";
import { BiffAction } from "../state";

interface AuthSession {
  token: string;
  createdAt: number;
}

const sessions: Map<string, AuthSession> = new Map();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const cookie = req.headers.cookie;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return res.status(500).json({ error: "ADMIN_SECRET not configured" });
  }

  const token =
    authHeader?.replace("Bearer ", "") ||
    cookie
      ?.split(";")
      .find((c) => c.trim().startsWith("admin_token="))
      ?.split("=")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const session = sessions.get(token);
  if (!session || Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    return res.status(401).json({ error: "Session expired" });
  }

  next();
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(token);
    }
  }
}
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

export function startApiServer(walletAddress: string) {
  const app = express();
  app.use(express.json());

  // ─── Public API ────────────────────────────────────────────────

  app.get("/api/state", (req: Request, res: Response) => {
    try {
      const store = getStore();
      res.json(store.getState());
    } catch (e: any) {
      logger.error("API /api/state error", { error: e.message });
      res.status(500).json({ error: "Failed to get agent state" });
    }
  });

  app.get("/api/history", (req: Request, res: Response) => {
    try {
      const store = getStore();
      const limit = Math.min(Number(req.query.limit) || 100, 1000);
      res.json(store.getHistory(limit));
    } catch (e: any) {
      logger.error("API /api/history error", { error: e.message });
      res.status(500).json({ error: "Failed to get history" });
    }
  });

  app.get("/api/config", (req: Request, res: Response) => {
    try {
      const store = getStore();
      res.json(store.getConfig());
    } catch (e: any) {
      logger.error("API /api/config error", { error: e.message });
      res.status(500).json({ error: "Failed to get config" });
    }
  });

  // ─── Auth ──────────────────────────────────────────────────────

  app.post("/api/auth", (req: Request, res: Response) => {
    const { secret } = req.body;
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      return res.status(500).json({ error: "ADMIN_SECRET not configured" });
    }

    if (secret === adminSecret) {
      const token = generateToken();
      sessions.set(token, { token, createdAt: Date.now() });
      res.cookie("admin_token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: SESSION_TTL_MS,
        path: "/",
      });
      res.json({ success: true, token });
    } else {
      res.status(403).json({ error: "Invalid secret" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");
    if (token) sessions.delete(token);
    res.clearCookie("admin_token");
    res.json({ success: true });
  });

  // ─── Admin API (protected) ─────────────────────────────────────

  app.post("/api/pause", authMiddleware, (req: Request, res: Response) => {
    try {
      const store = getStore();
      store.pause();
      res.json({ success: true, message: "Agent paused" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/resume", authMiddleware, (req: Request, res: Response) => {
    try {
      const store = getStore();
      store.resume();
      res.json({ success: true, message: "Agent resumed" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post(
    "/api/force-cycle",
    authMiddleware,
    (req: Request, res: Response) => {
      try {
        const store = getStore();
        store.forceCycle();
        res.json({ success: true, message: "Force cycle triggered" });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    },
  );

  app.post(
    "/api/force-action",
    authMiddleware,
    (req: Request, res: Response) => {
      try {
        const { action } = req.body;
        const validActions: BiffAction[] = [
          "request_credit",
          "add_collateral",
          "repay_or_renew",
          "idle",
        ];
        if (!validActions.includes(action)) {
          return res.status(400).json({
            error: `Invalid action. Must be one of: ${validActions.join(", ")}`,
          });
        }
        const store = getStore();
        store.forceAction(action as BiffAction);
        res.json({ success: true, message: `Force action set: ${action}` });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    },
  );

  app.post("/api/config", authMiddleware, (req: Request, res: Response) => {
    try {
      const { minUsdcBalance, maxLtv, loanWarnDays, loopIntervalMin } =
        req.body;
      const updates: Record<string, number> = {};

      if (minUsdcBalance !== undefined)
        updates.minUsdcBalance = Number(minUsdcBalance);
      if (maxLtv !== undefined) updates.maxLtv = Number(maxLtv);
      if (loanWarnDays !== undefined)
        updates.loanWarnDays = Number(loanWarnDays);
      if (loopIntervalMin !== undefined)
        updates.loopIntervalMin = Number(loopIntervalMin);

      if (Object.keys(updates).length === 0) {
        return res
          .status(400)
          .json({ error: "No valid config fields provided" });
      }

      const store = getStore();
      store.updateConfig(updates);
      res.json({ success: true, config: store.getConfig() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Static Files (Frontend) ───────────────────────────────────

  const frontendDist = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "frontend",
    "dist",
  );
  app.use(express.static(frontendDist));

  // SPA fallback: serve index.html for non-API routes
  app.get("*", (req: Request, res: Response) => {
    if (req.path.startsWith("/api")) return;
    const indexPath = path.join(frontendDist, "index.html");
    try {
      res.sendFile(indexPath);
    } catch {
      res
        .status(404)
        .send("Frontend not built. Run: npm run build --workspace=frontend");
    }
  });

  const port = config.API_PORT;
  app.listen(port, () => {
    logger.info(`Admin API + Frontend server running on port ${port}`);
  });
}
