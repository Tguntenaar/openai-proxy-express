import { Request, Response, NextFunction } from "express";

export const validateApiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers.authorization?.replace("Bearer ", "");

  if (!apiKey || !process.env.OPENAI_API_KEY) {
    return res.status(401).json({
      error: {
        message: "Invalid API key",
        type: "invalid_api_key"
      }
    });
  }

  next();
};
