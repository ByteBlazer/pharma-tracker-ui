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
} as const;
