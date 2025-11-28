export enum DetailLevel {
  CONCISE = 'concise',
  STANDARD = 'standard',
  DETAILED = 'detailed',
  EXTREME = 'extreme'
}

export interface PromptRequest {
  imageBase64: string;
  mimeType: string;
  detailLevel: DetailLevel;
}

export interface PromptResponse {
  text: string;
}

export interface UploadedImage {
  src: string;
  file: File | null;
  mimeType: string;
}
