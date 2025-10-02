import { useContext } from "react";
import { GlobalContext } from "../components/GlobalContextProvider";
import { API_ENDPOINTS } from "../constants/GlobalConstants";
import { User } from "../types/User";
import { UserRole } from "../types/UserRole";
import { BaseLocation } from "../types/BaseLocation";

// Generic hook that provides authenticated API access
export const useApiService = () => {
  const { jwtToken } = useContext(GlobalContext);

  // Generic request function (all requests are authenticated)
  const request = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
      ...options.headers,
    };

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Try to extract the error message from the response
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If we can't parse the response as JSON, use the default error message
        console.warn("Could not parse error response as JSON:", parseError);
      }

      throw new Error(errorMessage);
    }

    return response.json();
  };

  return {
    // Generic request method
    request,

    // Convenience methods for common endpoints
    getUsers: () => request<User[]>(API_ENDPOINTS.USERS),
    getUserRoles: () => request<UserRole[]>(API_ENDPOINTS.USER_ROLES),
    getBaseLocations: () =>
      request<BaseLocation[]>(API_ENDPOINTS.BASE_LOCATIONS),

    // Generic CRUD operations
    get: <T>(endpoint: string) => request<T>(endpoint),
    post: <T>(endpoint: string, data: any) =>
      request<T>(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    put: <T>(endpoint: string, data: any) =>
      request<T>(endpoint, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: <T>(endpoint: string) =>
      request<T>(endpoint, {
        method: "DELETE",
      }),
  };
};
