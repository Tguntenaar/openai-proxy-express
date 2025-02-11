import type { Express } from "express";
import { createServer, type Server } from "http";
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

  // Apply middleware for protected routes
  app.use("/api", corsMiddleware);
  app.use("/api", rateLimiterMiddleware);
  app.use("/api", validateApiKeyMiddleware);
  

  // Add test endpoint
  app.get('/api/v1/test', (_req, res) => {
    res.json({ message: 'API is working' });
  });

  // PDF endpoint without auth
  app.post("/api/v1/documents/pdf", (req, res) => {
    try {
      const { markdown } = req.body;
      if (!markdown) {
        return res.status(400).json({
          error: {
            message: "Missing required field: markdown",
            type: "invalid_request_error",
          },
        });
      }

      const doc = documentService.generatePDF(markdown);

      // Set proper headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="document.pdf"');

      // Handle any errors in the PDF generation
      doc.on("error", (err) => {
        console.error("Error generating PDF:", err);
        if (!res.headersSent) {
          res.status(500).json({
            error: {
              message: "An error occurred generating PDF",
              type: "internal_server_error",
            },
          });
        } else {
          res.end();
        }
      });

      // Pipe the document to the response
      doc.pipe(res);

      // Finalize the PDF and end the stream
      doc.end();
    } catch (error: any) {
      // Only send error response if headers haven't been sent yet
      if (!res.headersSent) {
        res.status(error.status || 500).json({
          error: {
            message: error.message || "An error occurred generating PDF",
            type: error.type || "internal_server_error",
          },
        });
      }
    }
  });

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

  return httpServer;
}
