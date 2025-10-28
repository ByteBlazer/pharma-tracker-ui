import { TripStatus } from "./TripStatus";
import { DocGroup } from "./DocGroup";

export interface Trip {
  tripId: number;
  createdBy: string;
  createdById: string;
  driverName: string;
  driverId: string;
  driverPhoneNumber: string;
  vehicleNumber: string;
  status: TripStatus;
  route: string;
  createdAt: string;
  lastUpdatedAt: string;
  startedAt: string;
  creatorLocation: string;
  driverLocation: string;
  driverLastKnownLatitude: string;
  driverLastKnownLongitude: string;
  driverLastLocationUpdateTime: string | null;
  docGroups?: DocGroup[];
}
