// User interface for API responses
import { UserRole } from "./UserRole";

export interface User {
  id: string;
  personName: string;
  mobile: string;
  vehicleNbr: string;
  isActive: boolean;
  createdAt: Date;
  roles: UserRole[];
  baseLocationId: string;
  baseLocationName: string;
}
