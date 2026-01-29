import "./env-loader.js";
import express from "express";
import path from "path";
import { createServer } from "http";
import { createRestRouter } from "../rest.js";
import { serveStatic, setupVite } from "./vite.js";
import { connectDB } from "../models.js";
import { logger } from "./logger.js";
async function startServer() {
    await connectDB();
    const app = express();
    const server = createServer(app);
    app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
    // Configure body parser with larger size limit for file uploads
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));
    app.use((req, res, next) => {
        const start = process.hrtime.bigint();
        const { method, originalUrl } = req;
        res.on("finish", () => {
            const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
            logger.info(`[HTTP] ${method} ${originalUrl} ${res.statusCode} ${durationMs.toFixed(1)} ms`);
        });
        next();
    });
    // REST API
    app.use("/api", createRestRouter());
    const frontendUrl = process.env.FRONTEND_URL?.trim();
    const backendUrl = process.env.BACKEND_URL?.trim();
    const hasExternalFrontend = Boolean(frontendUrl) && frontendUrl !== (backendUrl || "");
    const shouldUseViteMiddleware = process.env.NODE_ENV === "development"
        && process.env.DISABLE_BACKEND_VITE !== "true"
        && !hasExternalFrontend;
    if (shouldUseViteMiddleware) {
        try {
            await setupVite(app, server);
        }
        catch (error) {
            logger.warn("[Vite] Failed to start Vite middleware. Skipping.", error?.message || error);
        }
    }
    else if (process.env.NODE_ENV !== "development" && !hasExternalFrontend) {
        serveStatic(app);
    }
    else {
        logger.info("[Vite] Backend Vite middleware disabled. Using external frontend dev server.");
    }
    app.use((error, req, res, next) => {
        if (error?.statusCode) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        if (error?.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ message: "File is too large." });
            return;
        }
        if (error?.code === "LIMIT_UNEXPECTED_FILE") {
            res.status(400).json({ message: "Too many files uploaded." });
            return;
        }
        logger.error("[API] Unexpected error:", error);
        res.status(500).json({ message: "Internal server error" });
    });

    const port = Number.parseInt(process.env.PORT || "3000", 10);
    server.listen(port, () => {
        logger.info(`[Server] Listening on port ${port}`);
    });
    server.on("error", (error) => {
        if (error?.code === "EADDRINUSE") {
            logger.error(`[Server] Port ${port} is already in use. Stop the other process or change PORT in backend/.env.`);
            process.exit(1);
        }
        logger.error("[Server] Failed to start:", error);
        process.exit(1);
    });
}
startServer().catch((error) => {
    logger.error("[Server] Startup failed:", error);
    process.exit(1);
});
