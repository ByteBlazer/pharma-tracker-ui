import React, { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
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

const PublicTracking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Function to format ETA from server
  const formatETA = (etaMinutes: number, status?: string): string => {
    if (etaMinutes === -1) {
      return status === "ON_TRIP" ? "Updating Soon" : "Unavailable";
    }

    if (etaMinutes < 1) {
      return "Less than a minute";
    } else if (etaMinutes < 60) {
      return `${Math.round(etaMinutes)} minutes`;
    } else {
      const hours = Math.floor(etaMinutes / 60);
      const minutes = Math.round(etaMinutes % 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  // Fetch tracking data with auto-refresh
  const {
    data: trackingData,
    isLoading,
    isError,
    error,
  } = useQuery<DocTrackingResponse>({
    queryKey: ["doc-tracking", token],
    queryFn: async () => {
      if (!token) {
        throw new Error("Invalid tracking link: No token provided");
      }

      const response = await fetch(API_ENDPOINTS.DOC_TRACKING(token));
      const data: DocTrackingResponse = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Failed to retrieve tracking information"
        );
      }

      return data;
    },
    enabled: !!token,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    refetchIntervalInBackground: true, // Continue refreshing even when tab is not active
  });

  // Initialize and update Google Map
  useEffect(() => {
    if (!trackingData || !mapRef.current) return;

    const { customerLocation, driverLastKnownLocation } = trackingData;

    // Only initialize map if we have locations to show
    if (!customerLocation && !driverLastKnownLocation) return;

    // Add CSS animation for blinking driver marker (if not already added)
    if (!document.getElementById("driver-blink-style-tracking")) {
      const style = document.createElement("style");
      style.id = "driver-blink-style-tracking";
      style.textContent = `
        @keyframes driverBlink {
          0%, 100% { 
            opacity: 1;
          }
          50% { 
            opacity: 0;
          }
        }
        .driver-marker-pulse {
          animation: driverBlink 1.5s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }

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
        optimized: false, // Disable optimization to allow CSS animations
        zIndex: 1000, // Ensure driver is above customer
      });

      // Add pulsing animation to driver marker
      setTimeout(() => {
        const imgs = document.querySelectorAll('img[src="/truck-front.png"]');
        imgs.forEach((img) => {
          img.classList.add("driver-marker-pulse");
        });
      }, 100);

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

  if (isError || !trackingData) {
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
          {error instanceof Error
            ? error.message
            : "Failed to load tracking information"}
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
              {(() => {
                const updateTime = new Date(
                  trackingData.driverLastKnownLocation.receivedAt
                );
                const today = new Date();

                // Check if the update date is today
                const isToday =
                  updateTime.getDate() === today.getDate() &&
                  updateTime.getMonth() === today.getMonth() &&
                  updateTime.getFullYear() === today.getFullYear();

                if (isToday) {
                  // Show only time for today (without seconds)
                  return updateTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } else {
                  // Show full date and time for other days (without seconds)
                  return updateTime.toLocaleString([], {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }
              })()}
            </Typography>
          </Box>
        )}

        {trackingData.eta !== undefined &&
          trackingData.status !== "DELIVERED" &&
          trackingData.status !== "UNDELIVERED" && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Estimated Delivery Time:</strong>
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  color:
                    trackingData.eta === -1 ? "warning.main" : "primary.main",
                }}
              >
                {formatETA(trackingData.eta, trackingData.status)}
              </Typography>
            </Box>
          )}

        {trackingData.numEnrouteCustomers !== undefined &&
          trackingData.numEnrouteCustomers > 0 && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> The delivery agent has{" "}
                  <strong>{trackingData.numEnrouteCustomers}</strong>{" "}
                  {trackingData.numEnrouteCustomers === 1
                    ? "delivery"
                    : "deliveries"}{" "}
                  to make before reaching you. The actual delivery time may be
                  longer than estimated.
                </Typography>
              </Alert>
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
