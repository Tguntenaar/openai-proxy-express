import rateLimit from "express-rate-limit";
import { config } from "../config";

export const rateLimiterMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: {
      message: "Too many requests, please try again later.",
      type: "rate_limit_error"
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
