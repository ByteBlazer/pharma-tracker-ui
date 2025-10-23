import { Trip } from "./Trip";

export interface AllTripsResponse {
  success: boolean;
  message: string;
  trips: Trip[];
  totalTrips: number;
  statusCode: number;
}
