import { DocStatus } from "./DocStatus";
import { TripStatus } from "./TripStatus";

export interface DocSearchResponse {
  docId: string;
  docStatus: DocStatus;
  tripId?: number;
  tripStatus?: TripStatus;
}
