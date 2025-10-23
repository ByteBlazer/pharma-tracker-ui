import { DocStatus } from "./DocStatus";

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
