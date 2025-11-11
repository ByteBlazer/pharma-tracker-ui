import { DocStatus } from "./DocStatus";
import { Doc } from "./Doc";

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
  customerId?: string;
  customerDocs?: Doc[];
}
