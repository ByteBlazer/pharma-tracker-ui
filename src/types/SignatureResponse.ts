export interface SignatureResponse {
  success: boolean;
  signature: string; // Base64 encoded image
  lastUpdatedAt: string;
}
