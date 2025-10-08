import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  LocalShipping,
  Schedule,
} from "@mui/icons-material";
import { DocTrackingResponse } from "../../types/DocTracking";
import { API_ENDPOINTS } from "../../constants/GlobalConstants";

// Haversine distance-based ETA calculation

const PublicTracking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [trackingData, setTrackingData] = useState<DocTrackingResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eta, setEta] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Function to calculate driver location age in minutes
  const calculateDriverLocationAge = (receivedAt: string): number => {
    const now = new Date();
    const locationTime = new Date(receivedAt);
    const diffInMs = now.getTime() - locationTime.getTime();
    return Math.floor(diffInMs / (1000 * 60)); // Convert to minutes
  };

  // Function to get travel time using haversine distance calculation
  const getTravelTime = async (
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<number> => {
    // Haversine distance calculation
    const haversineDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const R = 6371; // Earth's radius in kilometers
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in kilometers
    };

    const distance = haversineDistance(originLat, originLng, destLat, destLng);

    // Realistic estimation for Indian city traffic
    // Adjust speed based on distance - shorter distances have slower average speeds due to traffic
    let averageSpeed = 35; // km/h default

    if (distance < 5) {
      averageSpeed = 20; // Heavy traffic in city center
    } else if (distance < 15) {
      averageSpeed = 25; // Moderate traffic
    } else if (distance < 30) {
      averageSpeed = 35; // Mixed roads
    } else {
      averageSpeed = 45; // Highway speeds
    }

    const estimatedTravelTime = (distance / averageSpeed) * 60; // Convert to minutes
    console.log(
      `Distance: ${distance.toFixed(
        2
      )} km, Speed: ${averageSpeed} km/h, Travel time: ${estimatedTravelTime.toFixed(
        1
      )} minutes`
    );

    return estimatedTravelTime;
  };

  // Function to calculate ETA
  const calculateETA = async (
    trackingData: DocTrackingResponse
  ): Promise<string> => {
    if (
      !trackingData.customerLocation ||
      !trackingData.driverLastKnownLocation ||
      trackingData.otherCustomersServiceTime === undefined
    ) {
      return "ETA not available";
    }

    const driverLat = parseFloat(trackingData.driverLastKnownLocation.latitude);
    const driverLng = parseFloat(
      trackingData.driverLastKnownLocation.longitude
    );
    const currentCustomerLat = parseFloat(
      trackingData.customerLocation.latitude
    );
    const currentCustomerLng = parseFloat(
      trackingData.customerLocation.longitude
    );

    try {
      // Get travel time using haversine distance calculation
      const travelTime = await getTravelTime(
        driverLat,
        driverLng,
        currentCustomerLat,
        currentCustomerLng
      );
      console.log("travelTime", travelTime);

      // Add service time for other customers
      const totalMinutes =
        travelTime + (trackingData.otherCustomersServiceTime || 0);

      // Calculate driver location age and deduct from ETA
      const driverLocationAge = calculateDriverLocationAge(
        trackingData.driverLastKnownLocation.receivedAt
      );
      const adjustedMinutes = Math.max(0, totalMinutes - driverLocationAge);

      // Format the result
      if (adjustedMinutes < 1) {
        return "Less than a minute";
      } else if (adjustedMinutes < 60) {
        return `${Math.round(adjustedMinutes)} minutes`;
      } else {
        const hours = Math.floor(adjustedMinutes / 60);
        const minutes = Math.round(adjustedMinutes % 60);
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
    } catch (error) {
      console.error("Error calculating ETA:", error);

      // Fallback: Use haversine distance calculation as rough estimate
      try {
        const haversineDistance = (
          lat1: number,
          lon1: number,
          lat2: number,
          lon2: number
        ): number => {
          const R = 6371; // Earth's radius in kilometers
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
              Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c; // Distance in kilometers
        };

        const distance = haversineDistance(
          driverLat,
          driverLng,
          currentCustomerLat,
          currentCustomerLng
        );
        const estimatedTravelTime = distance * 2.4; // More realistic estimate: 25 km/h average speed in city traffic

        const totalMinutes =
          estimatedTravelTime + (trackingData.otherCustomersServiceTime || 0);
        const driverLocationAge = calculateDriverLocationAge(
          trackingData.driverLastKnownLocation.receivedAt
        );
        const adjustedMinutes = Math.max(0, totalMinutes - driverLocationAge);

        if (adjustedMinutes < 1) {
          return "Less than a minute (estimated)";
        } else if (adjustedMinutes < 60) {
          return `${Math.round(adjustedMinutes)} minutes (estimated)`;
        } else {
          const hours = Math.floor(adjustedMinutes / 60);
          const minutes = Math.round(adjustedMinutes % 60);
          return minutes > 0
            ? `${hours}h ${minutes}m (estimated)`
            : `${hours}h (estimated)`;
        }
      } catch (fallbackError) {
        console.error("Fallback calculation also failed:", fallbackError);
        return "ETA not available";
      }
    }
  };

  // Fetch tracking data
  useEffect(() => {
    const fetchTrackingData = async () => {
      if (!token) {
        setError("Invalid tracking link: No token provided");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(API_ENDPOINTS.DOC_TRACKING(token));
        const data: DocTrackingResponse = await response.json();

        if (!data.success) {
          setError(data.message || "Failed to retrieve tracking information");
          setIsLoading(false);
          return;
        }

        setTrackingData(data);

        // Calculate ETA if both locations are available
        if (
          data.customerLocation &&
          data.driverLastKnownLocation &&
          data.otherCustomersServiceTime !== undefined
        ) {
          const etaResult = await calculateETA(data);
          setEta(etaResult);
        } else {
          setEta(null);
        }

        setIsLoading(false);
      } catch (err) {
        setError("Failed to load tracking information");
        setIsLoading(false);
      }
    };

    fetchTrackingData();
  }, [token]);

  // Initialize and update Google Map
  useEffect(() => {
    if (!trackingData || !mapRef.current) return;

    const { customerLocation, driverLastKnownLocation } = trackingData;

    // Only initialize map if we have locations to show
    if (!customerLocation && !driverLastKnownLocation) return;

    // Initialize map if not already initialized
    if (!mapInstanceRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: 9.9312, lng: 76.2673 }, // Default center
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        minZoom: 4,
        maxZoom: 18,
      });
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const bounds = new window.google.maps.LatLngBounds();
    const markers: any[] = [];

    // Add customer marker if available
    if (customerLocation) {
      const customerMarker = new window.google.maps.Marker({
        position: {
          lat: parseFloat(customerLocation.latitude),
          lng: parseFloat(customerLocation.longitude),
        },
        map: map,
        title: "Delivery Location",
        icon: {
          url: "/customer.png",
          scaledSize: new window.google.maps.Size(65, 70),
          anchor: new window.google.maps.Point(32.5, 70),
        },
      });
      markers.push(customerMarker);
      bounds.extend(customerMarker.getPosition());
    }

    // Add driver marker if available
    if (driverLastKnownLocation) {
      const driverMarker = new window.google.maps.Marker({
        position: {
          lat: parseFloat(driverLastKnownLocation.latitude),
          lng: parseFloat(driverLastKnownLocation.longitude),
        },
        map: map,
        title: "Driver Location",
        icon: {
          url: "/truck-front.png",
          scaledSize: new window.google.maps.Size(75, 75),
          anchor: new window.google.maps.Point(37.5, 37.5),
        },
      });
      markers.push(driverMarker);
      bounds.extend(driverMarker.getPosition());
    }

    // Fit map to show all markers
    if (markers.length > 0) {
      map.fitBounds(bounds);
    }

    // Cleanup markers on unmount or update
    return () => {
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [trackingData]);

  // Get status icon and color
  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case "DELIVERED":
        return {
          icon: <CheckCircle />,
          color: "success" as const,
          label: "Delivered",
        };
      case "UNDELIVERED":
        return {
          icon: <Cancel />,
          color: "error" as const,
          label: "Undelivered",
        };
      case "ON_TRIP":
        return {
          icon: <LocalShipping />,
          color: "primary" as const,
          label: "On Trip",
        };
      case "AT_TRANSIT_HUB":
        return {
          icon: <LocalShipping />,
          color: "warning" as const,
          label: "At Transit Hub",
        };
      case "TRIP_SCHEDULED":
        return {
          icon: <Schedule />,
          color: "info" as const,
          label: "Trip Scheduled",
        };
      case "READY_FOR_DISPATCH":
        return {
          icon: <Schedule />,
          color: "default" as const,
          label: "Ready for Dispatch",
        };
      default:
        return {
          icon: <Schedule />,
          color: "default" as const,
          label: status || "Unknown",
        };
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>Loading tracking information...</Typography>
      </Box>
    );
  }

  if (error || !trackingData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          {error || "Failed to load tracking information"}
        </Alert>
      </Box>
    );
  }

  const statusDisplay = getStatusDisplay(trackingData.status);
  const hasMap =
    trackingData.customerLocation || trackingData.driverLastKnownLocation;

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header Overlay */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          zIndex: 1000,
          borderRadius: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="h5" component="h1" sx={{ fontWeight: "bold" }}>
            Delivery Tracking
          </Typography>
          <Chip
            icon={statusDisplay.icon}
            label={statusDisplay.label}
            color={statusDisplay.color}
            size="medium"
          />
        </Box>

        {/* Additional Information */}
        {trackingData.comment && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> {trackingData.comment}
            </Typography>
          </Box>
        )}

        {trackingData.deliveryTimestamp && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Delivered at:</strong>{" "}
              {new Date(trackingData.deliveryTimestamp).toLocaleString()}
            </Typography>
          </Box>
        )}

        {trackingData.driverLastKnownLocation?.receivedAt && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Driver location updated:</strong>{" "}
              {new Date(
                trackingData.driverLastKnownLocation.receivedAt
              ).toLocaleString()}
            </Typography>
          </Box>
        )}

        {eta && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Estimated Delivery Time:</strong>{" "}
              <span style={{ color: "#1976d2", fontWeight: "bold" }}>
                {eta}
              </span>
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Map or Status Message */}
      <Box sx={{ flex: 1, position: "relative" }}>
        {hasMap ? (
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              bgcolor: "background.default",
            }}
          >
            <Alert severity="info" sx={{ maxWidth: 600 }}>
              {trackingData.status === "DELIVERED" ||
              trackingData.status === "UNDELIVERED"
                ? "Delivery has been completed. Location tracking is no longer available."
                : "Location tracking is not available for this delivery at the moment."}
            </Alert>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PublicTracking;
