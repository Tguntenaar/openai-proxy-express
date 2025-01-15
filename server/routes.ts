import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { corsMiddleware } from "./middleware/cors";
import { rateLimiterMiddleware } from "./middleware/rateLimiter";
import { validateApiKeyMiddleware } from "./middleware/validateApiKey";
import { OpenAIService } from "./services/openai";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const openaiService = new OpenAIService();

  // Apply middleware
  app.use("/api", corsMiddleware);
  app.use("/api", rateLimiterMiddleware);
  app.use("/api", validateApiKeyMiddleware);

  // Mirror OpenAI's chat completion endpoint
  app.post("/api/v1/chat/completions", async (req, res) => {
    try {
      const stream = req.query.stream === "true";
      
      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        await openaiService.streamChatCompletion(req.body, res);
      } else {
        const response = await openaiService.createChatCompletion(req.body);
        res.json(response);
      }
    } catch (error: any) {
      res.status(error.status || 500).json({
        error: {
          message: error.message || "An error occurred during chat completion",
          type: error.type || "internal_server_error",
        }
      });
    }
  });

  // Mirror OpenAI's embeddings endpoint
  app.post("/api/v1/embeddings", async (req, res) => {
    try {
      const response = await openaiService.createEmbeddings(req.body);
      res.json(response);
    } catch (error: any) {
      res.status(error.status || 500).json({
        error: {
          message: error.message || "An error occurred creating embeddings",
          type: error.type || "internal_server_error",
        }
      });
    }
  });

  // Mirror OpenAI's models endpoint
  app.get("/api/v1/models", async (_req, res) => {
    try {
      const response = await openaiService.listModels();
      res.json(response);
    } catch (error: any) {
      res.status(error.status || 500).json({
        error: {
          message: error.message || "An error occurred fetching models",
          type: error.type || "internal_server_error",
        }
      });
    }
  });

  return httpServer;
}
