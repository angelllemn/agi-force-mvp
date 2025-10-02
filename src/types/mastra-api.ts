/**
 * Tipos para la API de Mastra basados en respuestas reales del servidor
 * Actualizado con la estructura completa que devuelve Mastra
 */

export interface MastraAgentRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

export interface MastraUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface MastraProviderMetadata {
  openai: {
    reasoningTokens: number;
    acceptedPredictionTokens: number;
    rejectedPredictionTokens: number;
    cachedPromptTokens: number;
  };
}

export interface MastraRequestInfo {
  body: string;
}

export interface MastraResponseInfo {
  id: string;
  timestamp: string;
  modelId: string;
  headers: Record<string, string>;
  body: {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: any[];
    usage: any;
    service_tier: string;
    system_fingerprint: string;
  };
  messages: any[];
}

export interface MastraStep {
  stepType: string;
  text: string;
  reasoningDetails: any[];
  files: any[];
  sources: any[];
  toolCalls: any[];
  toolResults: any[];
  finishReason: string;
  usage: MastraUsage;
  warnings: any[];
  request: MastraRequestInfo;
  response: MastraResponseInfo;
  providerMetadata: MastraProviderMetadata;
  experimental_providerMetadata: MastraProviderMetadata;
  isContinued: boolean;
}

export interface MastraAgentResponse {
  text: string;
  files: any[];
  reasoningDetails: any[];
  toolCalls: any[];
  toolResults: any[];
  finishReason: string;
  usage: MastraUsage;
  warnings: any[];
  request: MastraRequestInfo;
  response: MastraResponseInfo;
  steps: MastraStep[];
  experimental_providerMetadata: MastraProviderMetadata;
  providerMetadata: MastraProviderMetadata;
  sources: any[];
}

export interface MastraApiError {
  error: string;
  status: number;
  statusText: string;
}

export interface MastraLanguageModelUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
}

export interface MastraLLMStepResult {
  stepType?: 'initial' | 'tool-result';
  toolCalls: Array<Record<string, unknown>>;
  toolResults: Array<Record<string, unknown>>;
  dynamicToolCalls: Array<Record<string, unknown>>;
  dynamicToolResults: Array<Record<string, unknown>>;
  staticToolCalls: Array<Record<string, unknown>>;
  staticToolResults: Array<Record<string, unknown>>;
  files: Array<Record<string, unknown>>;
  sources: Array<Record<string, unknown>>;
  text: string;
  reasoning: Array<Record<string, unknown>>;
  content: Array<Record<string, unknown>>;
  finishReason?: string;
  usage: MastraLanguageModelUsage;
  warnings: Array<Record<string, unknown>>;
  request: { body?: unknown };
  response: Record<string, unknown>;
  reasoningText?: string;
  providerMetadata?: Record<string, unknown>;
}

export interface MastraModelOutputResult<Output = unknown> {
  traceId?: string;
  scoringData?: {
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  };
  text: string;
  usage: MastraLanguageModelUsage;
  steps: MastraLLMStepResult[];
  finishReason?: string;
  warnings: Array<Record<string, unknown>>;
  providerMetadata?: Record<string, unknown>;
  request: { body?: unknown };
  reasoning: Array<Record<string, unknown>>;
  reasoningText?: string;
  toolCalls: Array<Record<string, unknown>>;
  toolResults: Array<Record<string, unknown>>;
  sources: Array<Record<string, unknown>>;
  files: Array<Record<string, unknown>>;
  response: Record<string, unknown>;
  totalUsage: MastraLanguageModelUsage;
  object: Output;
  error?: string | Error | { message: string; stack: string };
  tripwire: boolean;
  tripwireReason: string;
}
