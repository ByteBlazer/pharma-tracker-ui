// API Endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_ENDPOINTS = {
  GENERATE_OTP: `${API_BASE_URL}/auth/generate-otp`,
  VALIDATE_OTP: `${API_BASE_URL}/auth/validate-otp`,
  USERS: `${API_BASE_URL}/auth/users`,
  USER_ROLES: `${API_BASE_URL}/auth/user-roles`,
  BASE_LOCATIONS: `${API_BASE_URL}/auth/base-locations`,
  CREATE_USER: `${API_BASE_URL}/auth/users`,
  UPDATE_USER: (userId: string) => `${API_BASE_URL}/auth/users/${userId}`,
  UPDATE_BASE_LOCATION: (locationId: string) =>
    `${API_BASE_URL}/auth/base-locations/${locationId}`,
  SETTING: (settingName: string) => `${API_BASE_URL}/setting/${settingName}`,
  UPDATE_SETTING: `${API_BASE_URL}/setting`,
  ALL_TRIPS: `${API_BASE_URL}/trip/all-trips`,
  TRIP_DETAIL: (tripId: number) => `${API_BASE_URL}/trip/${tripId}`,
  DOC_TRACKING: (token: string) =>
    `${API_BASE_URL}/doc/tracking?token=${token}`,
  CREATE_BACKUP: `${API_BASE_URL}/setting/backup`,
  LIST_BACKUPS: `${API_BASE_URL}/setting/backups`,
  RESTORE_BACKUP: `${API_BASE_URL}/setting/restore`,
  DOWNLOAD_BACKUP: (filename: string) =>
    `${API_BASE_URL}/setting/backup/download/${filename}`,
} as const;

// Setting Names
export const SETTING_NAMES = {
  COOL_OFF_SECONDS_BTWN_DIFF_ROUTE_SCANS:
    "COOL_OFF_SECONDS_BTWN_DIFF_ROUTE_SCANS",
  MINS_BETWEEN_LOCATION_HEARTBEATS: "MINS_BETWEEN_LOCATION_HEARTBEATS",
} as const;
