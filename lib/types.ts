export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text?: string;
  imageBase64?: string;
  createdAt: number;
}

export interface GenerateImagePayload {
  prompt: string;
  history: Array<{
    role: ChatRole;
    text?: string;
  }>;
  baseImage?: string;
  aspectRatio?: string;
  imageSize?: string;
}

export interface GenerateImageResponse {
  imageBase64: string;
  altText: string;
  modelVersion?: string;
}
