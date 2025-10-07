export interface DocTrackingResponse {
  success: boolean;
  message: string;
  status?: string;
  comment?: string;
  deliveryTimestamp?: string;
  customerLocation?: {
    latitude: string;
    longitude: string;
  };
  driverLastKnownLocation?: {
    latitude: string;
    longitude: string;
    receivedAt: string;
  };
}
