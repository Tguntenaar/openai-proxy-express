export const config = {
  allowedOrigins: ["https://yourcollegecontact.com", "http://localhost:3000", "https://openaiproxy-late-forest-1845.fly.dev"],
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};
