// Define the structure of your JWT payload (matches server-side)
export interface LoggedInUser {
  id: string;
  username: string;
  mobile: string;
  roles: string; // Comma-separated string of role names
  locationHeartBeatFrequencyInSeconds: number;
  baseLocationId: string;
  baseLocationName: string;
  // Standard JWT fields
  iat?: number; // Issued at
  exp?: number; // Expiration time
}
