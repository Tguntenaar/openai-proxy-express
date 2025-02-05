/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerplexityService } from '../perplexity';
import fetch from 'node-fetch';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

describe('PerplexityService', () => {
  let service: PerplexityService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    process.env.PERPLEXITY_API_KEY = 'test-key';
    service = new PerplexityService();
    vi.mocked(fetch).mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('should throw error if PERPLEXITY_API_KEY is not set', () => {
    delete process.env.PERPLEXITY_API_KEY;
    expect(() => new PerplexityService()).toThrow('PERPLEXITY_API_KEY environment variable is not set');
  });

  describe('getChatCompletion', () => {
    it('should successfully get chat completion', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'test-model',
        object: 'chat.completion',
        created: 1234567890,
        citations: [],
        choices: [
          {
            index: 0,
            finish_reason: 'stop',
            message: {
              role: 'assistant',
              content: 'Test response'
            }
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const requestData = {
        model: 'mixtral-8x7b-instruct',
        messages: [{ role: 'user', content: 'Hello' }]
      };

      const result = await service.getChatCompletion(requestData);

      expect(fetch).toHaveBeenCalledWith('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer test-key`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      } as any);

      const requestData = {
        model: 'mixtral-8x7b-instruct',
        messages: [{ role: 'user', content: 'Hello' }]
      };

      await expect(service.getChatCompletion(requestData)).rejects.toThrow('Error: Bad Request');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      vi.mocked(fetch).mockRejectedValueOnce(networkError);

      const requestData = {
        model: 'mixtral-8x7b-instruct',
        messages: [{ role: 'user', content: 'Hello' }]
      };

      await expect(service.getChatCompletion(requestData)).rejects.toThrow('Network error');
    });

    it('should handle optional parameters', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'test-model',
        object: 'chat.completion',
        created: 1234567890,
        citations: [],
        choices: [
          {
            index: 0,
            finish_reason: 'stop',
            message: {
              role: 'assistant',
              content: 'Test response'
            }
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const requestData = {
        model: 'mixtral-8x7b-instruct',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 100,
        temperature: 0.7,
        top_p: 0.9,
        search_domain_filter: ['news'],
        return_images: true,
        return_related_questions: true,
        search_recency_filter: 'last_day',
        top_k: 3,
        presence_penalty: 0.5,
        frequency_penalty: 0.5
      };

      const result = await service.getChatCompletion(requestData);

      expect(fetch).toHaveBeenCalledWith('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer test-key`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      expect(result).toEqual(mockResponse);
    });
  });
}); 