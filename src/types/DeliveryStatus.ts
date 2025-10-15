export interface DeliveryStatusResponse {
  success: boolean;
  message: string;
  docId: string;
  status: string;
  comment?: string;
  signature?: string; // Base64 encoded image
  deliveredAt?: Date;
  statusCode: number;
}
