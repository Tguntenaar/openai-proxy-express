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
    }) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const part of stream) {
        res.write(`data: ${JSON.stringify(part)}\n\n`);
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