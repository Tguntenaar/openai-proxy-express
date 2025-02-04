import fetch from 'node-fetch';

interface PerplexityRequest {
  model: string;
  messages: { role: string; content: string }[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  search_domain_filter?: string[];
  return_images?: boolean;
  return_related_questions?: boolean;
  search_recency_filter?: string;
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class PerplexityService {
  private apiKey: string;

  constructor() {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY environment variable is not set");
    }
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  async getChatCompletion(requestData: PerplexityRequest): Promise<PerplexityResponse> {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return response.json();
  }
}
