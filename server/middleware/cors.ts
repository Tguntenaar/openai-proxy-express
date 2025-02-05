import cors from "cors";
import { config } from "../config";

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization",
    "Accept",
    "Content-Disposition"  // Add this for PDF downloads
  ],
  exposedHeaders: ["Content-Disposition"],  // Add this to expose the download header
  credentials: true,
  maxAge: 86400
});