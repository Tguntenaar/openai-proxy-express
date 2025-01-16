import { Request, Response, NextFunction } from "express";

export const validateApiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers.authorization?.replace("Bearer ", "");

  if (!apiKey) {
    return res.status(401).json({
      error: {
        message: "Missing API key in request headers",
        type: "missing_api_key"
      }
    });
  }

  // Validate that our OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: {
        message: "Server configuration error - OpenAI API key not set",
        type: "server_configuration_error"
      }
    });
  }
  
  next();
};
