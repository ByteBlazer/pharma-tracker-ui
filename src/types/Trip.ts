export interface Trip {
  tripId: number;
  createdBy: string;
  createdById: string;
  driverName: string;
  driverId: string;
  vehicleNumber: string;
  status: TripStatus;
  route: string;
  createdAt: string;
  lastUpdatedAt: string;
  creatorLocation: string;
  driverLocation: string;
  driverLastKnownLatitude: string;
  driverLastKnownLongitude: string;
  driverLastLocationUpdateTime: string | null;
  docGroups?: DocGroup[];
}

export interface DocGroup {
  heading: string;
  droppable: boolean;
  dropOffCompleted: boolean;
  showDropOffButton: boolean;
  expandGroupByDefault: boolean;
  docs: Doc[];
}

export interface Doc {
  id: string;
  status: DocStatus;
  lastScannedBy: string;
  originWarehouse: string;
  tripId: string;
  docDate: string;
  docAmount: string;
  route: string;
  lot: string;
  comment: string;
  customerId: string;
  createdAt: string;
  lastUpdatedAt: string;
  customerFirmName: string;
  customerAddress: string;
  customerCity: string;
  customerPincode: string;
  customerPhone: string;
  customerGeoLatitude: string;
  customerGeoLongitude: string;
}

export enum TripStatus {
  SCHEDULED = "SCHEDULED",
  STARTED = "STARTED",
  ENDED = "ENDED",
}

export enum DocStatus {
  READY_FOR_DISPATCH = "READY_FOR_DISPATCH",
  TRIP_SCHEDULED = "TRIP_SCHEDULED",
  ON_TRIP = "ON_TRIP",
  AT_TRANSIT_HUB = "AT_TRANSIT_HUB",
  DELIVERED = "DELIVERED",
  UNDELIVERED = "UNDELIVERED",
}

export interface AllTripsResponse {
  success: boolean;
  message: string;
  trips: Trip[];
  totalTrips: number;
  statusCode: number;
}

export interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  type: "driver" | "customer";
  title: string;
  status?: DocStatus;
  tripId?: number;
  customerInfo?: {
    firmName: string;
    address: string;
    city: string;
    phone: string;
  };
}
