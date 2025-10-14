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
  enrouteCustomersServiceTime?: number; // in minutes
  numEnrouteCustomers?: number; // Number of customers nearer than current customer
  eta: number; // in minutes, -1 means unavailable
}
