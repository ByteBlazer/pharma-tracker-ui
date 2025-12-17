export interface DeliveryReportItem {
  // From doc table
  docId: string;
  status: string;
  originWarehouse: string;
  docDate: string; // ISO date string
  tripId: number;
  comment: string;
  customerId: string;
  lastUpdatedAt: string; // ISO date string

  // From customer table
  firmName: string;
  address: string;
  city: string;
  pincode: string;

  // From trip table
  createdBy: string; // user id
  createdByPersonName: string;
  createdByLocation: string;
  drivenBy: string; // user id (driver)
  driverName: string;
  vehicleNbr: string;
  route: string;
  tripStatus: string;
}

export interface DeliveryReportResponse {
  success: boolean;
  message: string;
  data: DeliveryReportItem[];
  totalRecords: number;
  statusCode: number;
}

export interface DeliveryReportFilters {
  fromDate?: string;
  toDate?: string;
  docId?: string;
  customerId?: string;
  customerCity?: string;
  originWarehouse?: string;
  tripId?: number;
  driverUserId?: string;
  route?: string;
  tripStartLocation?: string;
}
