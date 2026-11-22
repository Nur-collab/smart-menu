import { MenuItem } from './menu';
import { Language } from '@/lib/i18n';

export interface AiChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly timestamp: string;
  readonly recommendedItemIds?: readonly string[];
  readonly reasoning?: string;
}

export interface AiRecommendRequest {
  readonly message: string;
  readonly cartItemIds?: readonly string[];
  readonly language?: Language;
}

export interface AiRecommendResponse {
  readonly success: boolean;
  readonly reply: string;
  readonly recommendedItems: readonly MenuItem[];
  readonly quickPrompts: readonly string[];
}
