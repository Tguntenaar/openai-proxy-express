import OpenAI from "openai";
import { Response } from "express";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async createChatCompletion(body: any) {
    return await this.openai.chat.completions.create({
      ...body,
      model: body.model || "gpt-4o"
    });
  }

  async streamChatCompletion(body: any, res: Response) {
    const stream = await this.openai.chat.completions.create({
      ...body,
      model: body.model || "gpt-4o",
      stream: true
    });

    try {
      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        // Ensure the chunk is sent immediately
        if (res.socket?.writable) {
          res.socket.write('');
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    } finally {
      res.end();
    }
  }

  async createEmbeddings(body: any) {
    return await this.openai.embeddings.create(body);
  }

  async listModels() {
    return await this.openai.models.list();
  }
}