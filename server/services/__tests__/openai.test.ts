import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIService } from '../openai';
import { Response } from 'express';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      },
      embeddings: {
        create: vi.fn()
      },
      models: {
        list: vi.fn()
      }
    }))
  };
});

describe('OpenAIService', () => {
  let service: OpenAIService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    process.env.OPENAI_API_KEY = 'test-key';
    service = new OpenAIService();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('should throw error if OPENAI_API_KEY is not set', () => {
    delete process.env.OPENAI_API_KEY;
    expect(() => new OpenAIService()).toThrow('OPENAI_API_KEY environment variable is not set');
  });

  describe('createChatCompletion', () => {
    it('should create chat completion with default model', async () => {
      const mockResponse = { choices: [{ message: { content: 'Test response' } }] };
      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      service['openai'].chat.completions.create = mockCreate;

      const body = { messages: [{ role: 'user', content: 'Hello' }] };
      const result = await service.createChatCompletion(body);

      expect(mockCreate).toHaveBeenCalledWith({
        ...body,
        model: 'gpt-4o'
      });
      expect(result).toBe(mockResponse);
    });

    it('should use provided model if specified', async () => {
      const mockResponse = { choices: [{ message: { content: 'Test response' } }] };
      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      service['openai'].chat.completions.create = mockCreate;

      const body = { messages: [{ role: 'user', content: 'Hello' }], model: 'gpt-3.5-turbo' };
      const result = await service.createChatCompletion(body);

      expect(mockCreate).toHaveBeenCalledWith(body);
      expect(result).toBe(mockResponse);
    });
  });

  describe('streamChatCompletion', () => {
    it('should stream chat completion and set correct headers', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Hello' } }] };
          yield { choices: [{ delta: { content: ' World' } }] };
        }
      };

      const mockCreate = vi.fn().mockResolvedValue(mockStream);
      service['openai'].chat.completions.create = mockCreate;

      const mockRes = {
        setHeader: vi.fn(),
        write: vi.fn(),
        end: vi.fn()
      } as unknown as Response;

      const body = { messages: [{ role: 'user', content: 'Hello' }] };
      await service.streamChatCompletion(body, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(mockCreate).toHaveBeenCalledWith({
        ...body,
        model: 'gpt-4o',
        stream: true
      });
      expect(mockRes.write).toHaveBeenCalledTimes(2);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should handle streaming errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Stream error');
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          throw mockError;
        }
      };

      const mockCreate = vi.fn().mockResolvedValue(mockStream);
      service['openai'].chat.completions.create = mockCreate;

      const mockRes = {
        setHeader: vi.fn(),
        write: vi.fn(),
        end: vi.fn()
      } as unknown as Response;

      const body = { messages: [{ role: 'user', content: 'Hello' }] };
      await expect(service.streamChatCompletion(body, mockRes)).rejects.toThrow('Stream error');
      expect(mockRes.end).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Streaming error:', mockError);
      consoleSpy.mockRestore();
    });
  });

  describe('createEmbeddings', () => {
    it('should create embeddings', async () => {
      const mockResponse = { data: [{ embedding: [0.1, 0.2, 0.3] }] };
      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      service['openai'].embeddings.create = mockCreate;

      const body = { input: 'test text', model: 'text-embedding-ada-002' };
      const result = await service.createEmbeddings(body);

      expect(mockCreate).toHaveBeenCalledWith(body);
      expect(result).toBe(mockResponse);
    });
  });

  describe('listModels', () => {
    it('should list available models', async () => {
      const mockResponse = { data: [{ id: 'model-1' }, { id: 'model-2' }] };
      const mockList = vi.fn().mockResolvedValue(mockResponse);
      service['openai'].models.list = mockList;

      const result = await service.listModels();

      expect(mockList).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });
  });
}); 