export interface AvailableDriver {
  userId: string;
  driverName: string;
  vehicleNumber: string;
  baseLocationName: string;
  sameLocation: boolean;
  self: boolean;
}

export interface AvailableDriversResponse {
  success: boolean;
  message: string;
  drivers: AvailableDriver[];
  statusCode: number;
}
