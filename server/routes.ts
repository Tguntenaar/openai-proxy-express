import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { corsMiddleware } from "./middleware/cors";
import { rateLimiterMiddleware } from "./middleware/rateLimiter";
import { validateApiKeyMiddleware } from "./middleware/validateApiKey";
import { OpenAIService } from "./services/openai";
import { PerplexityService } from "./services/perplexity";
import { DocumentService } from "./services/pdf";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const openaiService = new OpenAIService();
  const perplexityService = new PerplexityService();
  const documentService = new DocumentService();

  // Add console log to verify routes are being registered
  console.log('Registering routes...');

  // Add test endpoint
  app.get('/api/v1/test', (_req, res) => {
    res.json({ message: 'API is working' });
  });

  // Apply middleware
  app.use("/api", corsMiddleware);
  app.use("/api", rateLimiterMiddleware);
  app.use("/api", validateApiKeyMiddleware);

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

  app.post("/api/v1/perplexity/chat/completions", async (req, res) => {
    try {
      // Validate required fields
      const { model, messages } = req.body;
      if (!model || !messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: {
            message: "Missing required fields: model and messages array",
            type: "invalid_request_error"
          }
        });
      }

      const response = await perplexityService.getChatCompletion(req.body);
      res.json(response);
    } catch (error: any) {
      res.status(error.status || 500).json({
        error: {
          message: error.message || "An error occurred during chat completion",
          type: error.type || "internal_server_error",
        }
      });
    }
  });

  app.post("/api/v1/documents/pdf", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({
          error: {
            message: "Missing required field: text",
            type: "invalid_request_error"
          }
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
      
      const pdfStream = documentService.generatePDF(text);
      pdfStream.pipe(res);
    } catch (error: any) {
      res.status(error.status || 500).json({
        error: {
          message: error.message || "An error occurred generating PDF",
          type: error.type || "internal_server_error",
        }
      });
    }
  });

  app.post("/api/v1/documents/docx", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({
          error: {
            message: "Missing required field: text",
            type: "invalid_request_error"
          }
        });
      }

      const buffer = await documentService.generateDOCX(text);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=document.docx');
      res.send(buffer);
    } catch (error: any) {
      res.status(error.status || 500).json({
        error: {
          message: error.message || "An error occurred generating DOCX",
          type: error.type || "internal_server_error",
        }
      });
    }
  });

  return httpServer;
}
