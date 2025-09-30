// API Endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_ENDPOINTS = {
  GENERATE_OTP: `${API_BASE_URL}/auth/generate-otp`,
  VALIDATE_OTP: `${API_BASE_URL}/auth/validate-otp`,
} as const;
