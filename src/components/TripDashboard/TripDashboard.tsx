import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
  Paper,
  Divider,
  Button,
  Tabs,
  Tab,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from "@mui/material";
import {
  DirectionsCar,
  Person,
  Schedule,
  CheckCircle,
  Cancel,
  Warning,
  ConfirmationNumber,
  Refresh,
  StopCircle,
  Map,
} from "@mui/icons-material";
import { useApiService } from "../../hooks/useApiService";
import {
  Trip,
  AllTripsResponse,
  TripStatus,
  MapMarker,
  DocStatus,
} from "../../types/Trip";
import { DeliveryStatusResponse } from "../../types/DeliveryStatus";
import { API_ENDPOINTS } from "../../constants/GlobalConstants";
import ModalInfiniteSpinner from "../ModalInfiniteSpinner/ModalInfiniteSpinner";

// Google Maps type declarations
declare global {
  interface Window {
    google: any;
  }
}

// Google Maps component
interface GoogleMapProps {
  markers: MapMarker[];
  onMarkerClick: (tripId: number) => void;
  onCustomerMarkerClick: (marker: any, markerData: MapMarker) => void;
  selectedTripId: number | null;
  height: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  markers,
  onMarkerClick,
  onCustomerMarkerClick,
  selectedTripId,
  height,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    // Initialize map
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: 9.9312, lng: 76.2673 }, // Kochi, Kerala as default center
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      minZoom: 4,
      maxZoom: 18, // Restrict maximum zoom level to 15
    });

    mapInstanceRef.current = map;

    // Initialize InfoWindow
    infoWindowRef.current = new window.google.maps.InfoWindow();

    return () => {
      // Cleanup markers and info window
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add CSS animation for blinking driver markers (if not already added)
    if (!document.getElementById("driver-blink-style")) {
      const style = document.createElement("style");
      style.id = "driver-blink-style";
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

    // Add new markers
    markers.forEach((markerData) => {
      const markerIcon = getMarkerIcon(markerData);

      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map: mapInstanceRef.current,
        title: markerData.title,
        icon: markerIcon,
        zIndex: markerData.type === "customer" ? 1000 : 100, // Customer markers always on top
        optimized: markerData.type === "driver" ? false : true, // Disable optimization for driver to allow animation
      });

      // Add click listener
      marker.addListener("click", () => {
        if (markerData.type === "customer" && markerData.customerInfo) {
          // Show info window for customer markers
          onCustomerMarkerClick(marker, markerData);
        } else if (markerData.tripId) {
          // Handle driver marker clicks only if no trip is selected
          if (!selectedTripId) {
            onMarkerClick(markerData.tripId);
          }
          // If a trip is already selected, do nothing (marker is non-clickable)
        }
      });

      // Add pulsing class to driver markers
      if (markerData.type === "driver") {
        // Wait for marker to be added to DOM, then add animation class
        setTimeout(() => {
          const markerElement = marker.getIcon() as any;
          if (markerElement && markerElement.url) {
            // Find the img element in the DOM and add animation class
            const imgs = document.querySelectorAll(
              'img[src="/truck-front.png"]'
            );
            imgs.forEach((img) => {
              img.classList.add("driver-marker-pulse");
            });
          }
        }, 100);
      }

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach((marker) => {
        bounds.extend(marker.position);
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [markers, onMarkerClick]);

  return <div ref={mapRef} style={{ width: "100%", height }} />;
};

// Helper function to get marker icon based on type and status
const getMarkerIcon = (marker: MapMarker): string | any => {
  if (marker.type === "driver") {
    return {
      url: "/truck-front.png",
      scaledSize: new window.google.maps.Size(60, 60),
      anchor: new window.google.maps.Point(30, 30),
    };
  }

  // Customer marker - use PNG image
  return {
    url: "/customer.png",
    scaledSize: new window.google.maps.Size(65, 70),
    anchor: new window.google.maps.Point(32.5, 70), // Anchor at bottom point
  };
};

// Helper function to generate tracking URL
const generateTrackingUrl = (docId: string): string => {
  const token = btoa(docId); // Base64 encode the docId
  const baseUrl = window.location.origin;
  return `${baseUrl}/tracking?token=${token}`;
};

// Trip card component
interface TripCardProps {
  trip: Trip;
  isSelected: boolean;
  onClick: () => void;
  onForceEndClick?: (tripId: number) => void;
}

const TripCard: React.FC<TripCardProps> = ({
  trip,
  isSelected,
  onClick,
  onForceEndClick,
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case TripStatus.STARTED:
        return "success";
      case TripStatus.SCHEDULED:
        return "warning";
      case TripStatus.ENDED:
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: TripStatus) => {
    switch (status) {
      case TripStatus.STARTED:
        return <CheckCircle />;
      case TripStatus.SCHEDULED:
        return <Schedule />;
      case TripStatus.ENDED:
        return <Cancel />;
      default:
        return <Warning />;
    }
  };

  const handleViewMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking "View More"
    setIsExpanded(!isExpanded);
  };

  return (
    <Card
      sx={{
        cursor: "pointer",
        border: isSelected
          ? `2px solid ${theme.palette.primary.main}`
          : "1px solid #e0e0e0",
        backgroundColor: isSelected
          ? theme.palette.primary.light + "20"
          : "white",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: theme.shadows[4],
          transform: "translateY(-2px)",
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
            }}
          >
            {trip.route}
          </Typography>
        </Box>

        {!isExpanded && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 1,
            }}
          >
            <Chip
              icon={getStatusIcon(trip.status)}
              label={trip.status}
              color={getStatusColor(trip.status)}
              size="small"
            />
            <Typography
              variant="body2"
              color="primary"
              sx={{
                cursor: "pointer",
                textDecoration: "underline",
                "&:hover": {
                  color: "primary.dark",
                },
              }}
              onClick={handleViewMoreClick}
            >
              View More
            </Typography>
          </Box>
        )}

        {isExpanded && (
          <>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Person sx={{ mr: 1, fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {trip.driverName}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <DirectionsCar
                sx={{ mr: 1, fontSize: 16, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                {trip.vehicleNumber}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <ConfirmationNumber
                sx={{ mr: 1, fontSize: 16, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                Trip #{trip.tripId}
              </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Typography variant="caption" color="text.secondary">
              Created:{" "}
              {(() => {
                const createdDate = new Date(trip.createdAt);
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                const isToday =
                  createdDate.getDate() === today.getDate() &&
                  createdDate.getMonth() === today.getMonth() &&
                  createdDate.getFullYear() === today.getFullYear();

                const isYesterday =
                  createdDate.getDate() === yesterday.getDate() &&
                  createdDate.getMonth() === yesterday.getMonth() &&
                  createdDate.getFullYear() === yesterday.getFullYear();

                if (isToday) {
                  return `Today ${createdDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`;
                } else if (isYesterday) {
                  return `Yesterday ${createdDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`;
                } else {
                  return `${createdDate.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })} ${createdDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`;
                }
              })()}
            </Typography>
            {/* Only show Started timestamp for non-scheduled trips */}
            {trip.status !== TripStatus.SCHEDULED && (
              <>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Started:{" "}
                  {(() => {
                    const startedDate = new Date(trip.startedAt);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    const isToday =
                      startedDate.getDate() === today.getDate() &&
                      startedDate.getMonth() === today.getMonth() &&
                      startedDate.getFullYear() === today.getFullYear();

                    const isYesterday =
                      startedDate.getDate() === yesterday.getDate() &&
                      startedDate.getMonth() === yesterday.getMonth() &&
                      startedDate.getFullYear() === yesterday.getFullYear();

                    if (isToday) {
                      return `Today ${startedDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`;
                    } else if (isYesterday) {
                      return `Yesterday ${startedDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`;
                    } else {
                      return `${startedDate.toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })} ${startedDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`;
                    }
                  })()}
                </Typography>
              </>
            )}

            {/* Show Ended timestamp for ended trips */}
            {trip.status === TripStatus.ENDED && (
              <>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Ended:{" "}
                  {(() => {
                    const endedDate = new Date(trip.lastUpdatedAt);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    const isToday =
                      endedDate.getDate() === today.getDate() &&
                      endedDate.getMonth() === today.getMonth() &&
                      endedDate.getFullYear() === today.getFullYear();

                    const isYesterday =
                      endedDate.getDate() === yesterday.getDate() &&
                      endedDate.getMonth() === yesterday.getMonth() &&
                      endedDate.getFullYear() === yesterday.getFullYear();

                    if (isToday) {
                      return `Today ${endedDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`;
                    } else if (isYesterday) {
                      return `Yesterday ${endedDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`;
                    } else {
                      return `${endedDate.toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })} ${endedDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`;
                    }
                  })()}
                </Typography>
              </>
            )}

            {/* Force End Trip Button - Only for ongoing trips */}
            {trip.status === TripStatus.STARTED && onForceEndClick && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  fullWidth
                  startIcon={<StopCircle />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onForceEndClick(trip.tripId);
                  }}
                  sx={{ mb: 1 }}
                >
                  Force End Trip
                </Button>
              </>
            )}

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 1,
              }}
            >
              <Chip
                icon={getStatusIcon(trip.status)}
                label={trip.status}
                color={getStatusColor(trip.status)}
                size="small"
              />
              <Typography
                variant="body2"
                color="primary"
                sx={{
                  cursor: "pointer",
                  textDecoration: "underline",
                  "&:hover": {
                    color: "primary.dark",
                  },
                }}
                onClick={handleViewMoreClick}
              >
                View Less
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Main TripDashboard component
const TripDashboard: React.FC = () => {
  const { get, post } = useApiService();
  const queryClient = useQueryClient();
  const infoWindowRef = useRef<any>(null);

  // Function to show customer info window
  const showCustomerInfoWindow = useCallback(
    async (marker: any, markerData: MapMarker) => {
      if (!infoWindowRef.current || !markerData.customerInfo) return;

      const docId = markerData.id.replace("customer-", "");
      const trackingUrl = generateTrackingUrl(docId);

      // Show basic info first
      let content = `
      <div style="padding: 8px; font-family: Arial, sans-serif; max-width: 300px;">
        <h4 style="margin: 0 0 8px 0; color: #333;">${
          markerData.customerInfo.firmName
        }</h4>
        <p style="margin: 4px 0; color: #666; font-size: 14px;">
          <strong>Address:</strong> ${markerData.customerInfo.address}, ${
        markerData.customerInfo.city
      }
        </p>
        <p style="margin: 4px 0; color: #666; font-size: 14px;">
          <strong>Phone:</strong> ${markerData.customerInfo.phone}
        </p>
        <p style="margin: 4px 0; color: #333; font-size: 14px;">
          <strong>Status:</strong> 
          <span style="color: ${getStatusColor(
            markerData.status
          )}; font-weight: bold;">
            ${
              markerData.status === DocStatus.UNDELIVERED
                ? "DELIVERY FAILED"
                : markerData.status || "Unknown"
            }
          </span>
        </p>
    `;

      // If status is DELIVERED or UNDELIVERED, fetch delivery status
      if (
        markerData.status === DocStatus.DELIVERED ||
        markerData.status === DocStatus.UNDELIVERED
      ) {
        try {
          const deliveryStatus = await get<DeliveryStatusResponse>(
            API_ENDPOINTS.DOC_DELIVERY_STATUS(docId)
          );

          if (deliveryStatus.success) {
            // Add signature if available
            if (deliveryStatus.signature) {
              content += `
              <div style="margin: 12px 0;">
                <p style="margin: 4px 0; color: #666; font-size: 12px; font-weight: bold;">
                  Signature:
                </p>
                <img src="data:image/png;base64,${deliveryStatus.signature}" 
                     style="max-width: 100px; max-height: 60px; border: 1px solid #ddd; border-radius: 4px;"
                     alt="Delivery Signature" />
              </div>
            `;
            }

            // Add comments if available
            if (deliveryStatus.comment) {
              content += `
              <div style="margin: 12px 0;">
                <p style="margin: 4px 0; color: #666; font-size: 12px; font-weight: bold;">
                  Comments:
                </p>
                <p style="margin: 4px 0; color: #333; font-size: 12px; background: #f5f5f5; padding: 8px; border-radius: 4px;">
                  ${deliveryStatus.comment}
                </p>
              </div>
            `;
            }
          }
        } catch (error) {
          console.error("Failed to fetch delivery status:", error);
          // Continue without delivery status info
        }
      }

      content += `
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee;">
          <p style="margin: 4px 0; color: #666; font-size: 12px; font-weight: bold;">
            Tracking URL:
          </p>
          <div style="display: flex; align-items: center; gap: 4px;">
            <input 
              type="text" 
              value="${trackingUrl}" 
              readonly 
              style="flex: 1; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px; background: #f5f5f5;"
              id="tracking-url-${markerData.id}"
            />
            <button 
              onclick="copyToClipboard('tracking-url-${markerData.id}')"
              style="padding: 4px 8px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    `;

      // Add global copy function
      (window as any).copyToClipboard = (inputId: string) => {
        const input = document.getElementById(inputId) as HTMLInputElement;
        if (input) {
          input.select();
          document.execCommand("copy");
          // You could add a toast notification here
        }
      };

      infoWindowRef.current.setContent(content);
      infoWindowRef.current.open(marker.getMap(), marker);
    },
    [get]
  );

  // Helper function to get status color
  const getStatusColor = (status?: string): string => {
    switch (status) {
      case DocStatus.DELIVERED:
        return "#4caf50";
      case DocStatus.UNDELIVERED:
        return "#f44336";
      case DocStatus.ON_TRIP:
        return "#2196f3";
      case DocStatus.AT_TRANSIT_HUB:
        return "#ff9800";
      default:
        return "#666";
    }
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [activeTab, setActiveTab] = useState(0); // 0: Ongoing, 1: Scheduled, 2: Ended
  const [showGuidance, setShowGuidance] = useState(false);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const guidanceTimerRef = useRef<number | null>(null);
  const [forceEndDialogOpen, setForceEndDialogOpen] = useState(false);
  const [tripToForceEnd, setTripToForceEnd] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [refreshCountdown, setRefreshCountdown] = useState(20);

  // Fetch all trips
  const {
    data: allTripsData,
    isLoading: tripsLoading,
    isError: tripsError,
    error: tripsErrorMsg,
    refetch: refetchTrips,
    isFetching: isFetchingTrips,
  } = useQuery<AllTripsResponse>({
    queryKey: ["all-trips"],
    queryFn: () => get(API_ENDPOINTS.ALL_TRIPS),
    refetchInterval: 20000, // Auto-refresh every 20 seconds
    refetchIntervalInBackground: true, // Continue refreshing even when tab is not active
  });

  // Fetch selected trip details
  const { data: selectedTrip, isLoading: tripDetailLoading } = useQuery<Trip>({
    queryKey: ["trip-detail", selectedTripId],
    queryFn: () => get(API_ENDPOINTS.TRIP_DETAIL(selectedTripId!)),
    enabled: !!selectedTripId,
    refetchInterval: 20000, // Auto-refresh every 20 seconds
    refetchIntervalInBackground: true, // Continue refreshing even when tab is not active
  });

  // Force end trip mutation
  const forceEndTripMutation = useMutation({
    mutationFn: (tripId: number) =>
      post(API_ENDPOINTS.FORCE_END_TRIP(tripId), {}),
    onSuccess: () => {
      // Invalidate and refetch trips
      queryClient.invalidateQueries({ queryKey: ["all-trips"] });
      if (selectedTripId) {
        queryClient.invalidateQueries({
          queryKey: ["trip-detail", selectedTripId],
        });
      }
      // Close dialog and show success message
      setForceEndDialogOpen(false);
      setTripToForceEnd(null);
      setSuccessMessage(
        "Trip has been force ended successfully. All pending deliveries have been marked as undelivered."
      );
      // Deselect the trip
      setSelectedTripId(null);
    },
    onError: (error) => {
      console.error("Failed to force end trip:", error);
      setForceEndDialogOpen(false);
      setTripToForceEnd(null);
    },
  });

  // Handle trip selection/deselection
  const handleTripSelect = (tripId: number) => {
    if (selectedTripId === tripId) {
      // If clicking on the already selected trip, deselect it
      setSelectedTripId(null);
    } else {
      // Select the new trip
      setSelectedTripId(tripId);
    }
  };

  // Handle marker click
  const handleMarkerClick = useCallback(
    (tripId: number) => {
      if (selectedTripId === tripId) {
        // If clicking on the already selected trip marker, deselect it
        setSelectedTripId(null);
      } else {
        // Select the new trip
        setSelectedTripId(tripId);
      }
    },
    [selectedTripId]
  );

  // Handle force end trip click
  const handleForceEndClick = (tripId: number) => {
    setTripToForceEnd(tripId);
    setForceEndDialogOpen(true);
  };

  // Handle force end confirmation
  const handleForceEndConfirm = () => {
    if (tripToForceEnd) {
      forceEndTripMutation.mutate(tripToForceEnd);
    }
  };

  // Handle force end dialog close
  const handleForceEndDialogClose = () => {
    setForceEndDialogOpen(false);
    setTripToForceEnd(null);
  };

  // Handle success snackbar close
  const handleSuccessSnackbarClose = () => {
    setSuccessMessage("");
  };

  // Show guidance when trips are loaded (only for Ongoing tab with trips, and only once per session)
  useEffect(() => {
    // Check if we have ongoing trips (STARTED status)
    const ongoingTrips =
      allTripsData?.trips?.filter(
        (trip) => trip.status === TripStatus.STARTED
      ) || [];

    // Check if user has already seen guidance in this session
    const hasSeenGuidanceInSession = sessionStorage.getItem(
      "tripDashboardGuidanceSeen"
    );

    if (
      activeTab === 0 &&
      ongoingTrips.length > 0 &&
      !hasSeenGuidanceInSession
    ) {
      setShowGuidance(true);

      // Mark as seen in session storage
      sessionStorage.setItem("tripDashboardGuidanceSeen", "true");

      // Auto-dismiss after 10 seconds
      guidanceTimerRef.current = setTimeout(() => {
        setShowGuidance(false);
      }, 10000);
    } else {
      setShowGuidance(false);
      // Clear timer if tab changes or no trips
      if (guidanceTimerRef.current) {
        clearTimeout(guidanceTimerRef.current);
        guidanceTimerRef.current = null;
      }
    }

    // Cleanup timer on unmount
    return () => {
      if (guidanceTimerRef.current) {
        clearTimeout(guidanceTimerRef.current);
        guidanceTimerRef.current = null;
      }
    };
  }, [allTripsData, activeTab]);

  // Handle guidance dismiss
  const handleDismissGuidance = () => {
    setShowGuidance(false);
    // Clear timer when manually dismissed
    if (guidanceTimerRef.current) {
      clearTimeout(guidanceTimerRef.current);
      guidanceTimerRef.current = null;
    }
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSelectedTripId(null); // Deselect trip when switching tabs
  };

  // Filter trips by status based on active tab
  const getFilteredTrips = () => {
    if (!trips) return [];

    switch (activeTab) {
      case 0: // Ongoing trips
        return trips.filter((trip) => trip.status === TripStatus.STARTED);
      case 1: // Scheduled trips
        return trips.filter((trip) => trip.status === TripStatus.SCHEDULED);
      case 2: // Ended trips
        return trips.filter((trip) => trip.status === TripStatus.ENDED);
      default:
        return trips;
    }
  };

  // Calculate delivery statistics for selected trip
  const getTripSummary = () => {
    if (!selectedTrip?.docGroups) return null;

    let totalDeliveries = 0;
    let completedDeliveries = 0;
    let failedDeliveries = 0;
    let pendingDeliveries = 0;

    selectedTrip.docGroups.forEach((docGroup) => {
      docGroup.docs.forEach((doc) => {
        // Only count direct deliveries (documents without a lot)
        if (!doc.lot) {
          totalDeliveries++;
          switch (doc.status) {
            case DocStatus.DELIVERED:
              completedDeliveries++;
              break;
            case DocStatus.UNDELIVERED:
              failedDeliveries++;
              break;
            default:
              pendingDeliveries++;
              break;
          }
        }
      });
    });

    // Calculate dropoffs pending (doc groups where showDropOffButton is true)
    const dropoffsPending = selectedTrip.docGroups.filter(
      (docGroup) => docGroup.showDropOffButton
    ).length;

    // Calculate trip time elapsed since start (for STARTED and ENDED trips only)
    let duration = null;
    let durationLabel = "";

    if (
      selectedTrip.status === TripStatus.STARTED ||
      selectedTrip.status === TripStatus.ENDED
    ) {
      const tripStartTime = new Date(selectedTrip.startedAt);

      // For ended trips, use lastUpdatedAt as the end time
      // For started trips, use current time (real-time duration)
      const endTime =
        selectedTrip.status === TripStatus.ENDED
          ? new Date(selectedTrip.lastUpdatedAt)
          : new Date();

      const durationMs = endTime.getTime() - tripStartTime.getTime();
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationMinutes = Math.floor(
        (durationMs % (1000 * 60 * 60)) / (1000 * 60)
      );

      duration = `${durationHours}h ${durationMinutes}m`;
      durationLabel =
        selectedTrip.status === TripStatus.ENDED
          ? "Total Trip Duration:"
          : "Time Since Start Of Trip:";
    }

    return {
      totalDeliveries,
      completedDeliveries,
      failedDeliveries,
      pendingDeliveries,
      dropoffsPending,
      duration,
      durationLabel,
    };
  };

  // Initialize InfoWindow
  useEffect(() => {
    if (window.google) {
      infoWindowRef.current = new window.google.maps.InfoWindow();
    }

    return () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  // Countdown timer for refresh button
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          return 20; // Reset to 20 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Generate map markers - show filtered drivers when no trip is selected
  useEffect(() => {
    if (!allTripsData?.trips) return;

    // Only show all drivers when no trip is selected
    if (selectedTripId) return;

    const markers: MapMarker[] = [];

    // Filter trips based on active tab
    const filteredTrips = getFilteredTrips();

    filteredTrips.forEach((trip) => {
      // Add driver marker if coordinates are available
      if (trip.driverLastKnownLatitude && trip.driverLastKnownLongitude) {
        markers.push({
          id: `driver-${trip.tripId}`,
          position: {
            lat: parseFloat(trip.driverLastKnownLatitude),
            lng: parseFloat(trip.driverLastKnownLongitude),
          },
          type: "driver",
          title: `${trip.driverName} - ${trip.vehicleNumber} - ${trip.route}`,
          tripId: trip.tripId,
        });
      }
    });

    setMapMarkers(markers);
  }, [allTripsData, selectedTripId, activeTab]);

  // Add customer markers and selected trip's driver marker when trip is selected
  useEffect(() => {
    if (!selectedTripId || !selectedTrip?.docGroups) return;

    const customerMarkers: MapMarker[] = [];
    const selectedTripDriverMarker: MapMarker[] = [];

    // Add customer markers for selected trip (only for direct deliveries, not lots)
    selectedTrip.docGroups.forEach((docGroup) => {
      docGroup.docs.forEach((doc) => {
        // Only show markers for documents WITHOUT a lot (direct deliveries only)
        if (doc.customerGeoLatitude && doc.customerGeoLongitude && !doc.lot) {
          customerMarkers.push({
            id: `customer-${doc.id}`,
            position: {
              lat: parseFloat(doc.customerGeoLatitude),
              lng: parseFloat(doc.customerGeoLongitude),
            },
            type: "customer",
            title: doc.customerFirmName,
            status: doc.status,
            tripId: selectedTrip.tripId,
            customerInfo: {
              firmName: doc.customerFirmName,
              address: doc.customerAddress,
              city: doc.customerCity,
              phone: doc.customerPhone,
            },
          });
        }
      });
    });

    // Add driver marker for selected trip only
    if (
      selectedTrip.driverLastKnownLatitude &&
      selectedTrip.driverLastKnownLongitude
    ) {
      selectedTripDriverMarker.push({
        id: `driver-${selectedTrip.tripId}`,
        position: {
          lat: parseFloat(selectedTrip.driverLastKnownLatitude),
          lng: parseFloat(selectedTrip.driverLastKnownLongitude),
        },
        type: "driver",
        title: `${selectedTrip.driverName} - ${selectedTrip.vehicleNumber} - ${selectedTrip.route}`,
        tripId: selectedTrip.tripId,
      });
    }

    setMapMarkers([...selectedTripDriverMarker, ...customerMarkers]);
  }, [selectedTripId, selectedTrip]);

  const isLoading = tripsLoading || tripDetailLoading;
  const isError = tripsError;
  const error = tripsErrorMsg;

  if (isLoading) {
    return (
      <ModalInfiniteSpinner condition={isLoading} title="Loading trips..." />
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading trips:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </Alert>
      </Box>
    );
  }

  const trips = allTripsData?.trips || [];

  // Handle refresh locations
  const handleRefreshLocations = async () => {
    // Re-fetch all trips data to get latest driver locations
    await refetchTrips();
    setRefreshCountdown(20); // Reset countdown when manually refreshed
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" color="primary" sx={{ mb: 3 }}>
        Trip Dashboard
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
        }}
      >
        {/* Trip Cards */}
        <Box sx={{ flex: { xs: "1", md: "0 0 33%" } }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">
                {activeTab === 0 &&
                  `Ongoing Trips (${getFilteredTrips().length})`}
                {activeTab === 1 &&
                  `Scheduled Trips (${getFilteredTrips().length})`}
                {activeTab === 2 &&
                  `Ended Trips (${getFilteredTrips().length})`}
              </Typography>
            </Box>

            {/* Trip Status Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab
                label="Ongoing"
                sx={{ textTransform: "none", fontWeight: "bold" }}
              />
              <Tab
                label="Scheduled"
                sx={{ textTransform: "none", fontWeight: "bold" }}
              />
              <Tab
                label="Ended"
                sx={{ textTransform: "none", fontWeight: "bold" }}
              />
            </Tabs>

            <Box
              sx={{
                maxHeight: isMobile ? "300px" : "600px",
                overflow: "auto",
                position: "relative",
                pt: 1, // Add top padding to prevent first card edge clipping on hover
              }}
            >
              {getFilteredTrips().length === 0 ? (
                <Alert severity="info">
                  {activeTab === 0 && "No ongoing trips found."}
                  {activeTab === 1 && "No scheduled trips found."}
                  {activeTab === 2 && "No ended trips found."}
                </Alert>
              ) : (
                getFilteredTrips().map((trip, index) => (
                  <Box
                    key={trip.tripId}
                    sx={{ mb: 2 }}
                    ref={index === 0 ? firstCardRef : null}
                  >
                    <TripCard
                      trip={trip}
                      isSelected={selectedTripId === trip.tripId}
                      onClick={() => handleTripSelect(trip.tripId)}
                      onForceEndClick={handleForceEndClick}
                    />
                  </Box>
                ))
              )}
            </Box>

            {/* Guidance Speech Balloon */}
            <Popover
              open={showGuidance}
              anchorEl={firstCardRef.current}
              onClose={handleDismissGuidance}
              anchorOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              slotProps={{
                backdrop: {
                  onClick: handleDismissGuidance,
                },
              }}
              disableScrollLock={true}
              PaperProps={{
                sx: {
                  p: 0,
                  maxWidth: 300,
                  bgcolor: "transparent",
                  boxShadow: "none",
                  mt: -1.5,
                  overflow: "visible",
                },
              }}
            >
              <Box sx={{ position: "relative" }}>
                {/* Speech balloon body */}
                <Box
                  sx={{
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    p: 2,
                    borderRadius: 2,
                    transition: "opacity 1s ease-in-out",
                    opacity: showGuidance ? 1 : 0,
                  }}
                >
                  <Typography variant="body2">
                    👋 The map is now showing all driver locations. Click on a
                    trip card to view that trip's details alone!
                  </Typography>
                </Box>

                {/* Speech balloon tail/arrow pointing down */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: "-8px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderTop: "8px solid",
                    borderTopColor: "primary.main",
                    transition: "opacity 1s ease-in-out",
                    opacity: showGuidance ? 1 : 0,
                  }}
                />
              </Box>
            </Popover>
          </Paper>
        </Box>

        {/* Google Map */}
        <Box sx={{ flex: { xs: "1", md: "0 0 67%" } }}>
          <Paper sx={{ p: 2 }}>
            {/* Map Heading */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
                }}
              >
                {selectedTripId && selectedTrip
                  ? `Trip #${selectedTripId} - ${selectedTrip.route}`
                  : selectedTripId
                  ? `Trip #${selectedTripId}`
                  : activeTab === 0
                  ? "All Ongoing Trips - Driver Locations"
                  : activeTab === 1
                  ? "Select a Trip to View Details"
                  : "Select a Trip to View Details"}
              </Typography>
            </Box>

            {/* Action Buttons Row */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                gap: 2,
              }}
            >
              {/* Left side - Show All Trips button */}
              <Box>
                {selectedTripId && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Map />}
                    onClick={() => setSelectedTripId(null)}
                    sx={{
                      minWidth: "auto",
                      px: 2,
                    }}
                  >
                    {activeTab === 0 && "Show All Trips"}
                    {activeTab === 1 && "Show All Trips"}
                    {activeTab === 2 && "Show All Trips"}
                  </Button>
                )}
              </Box>

              {/* Right side - Refresh button */}
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={!isFetchingTrips && <Refresh />}
                  onClick={handleRefreshLocations}
                  disabled={isFetchingTrips}
                  sx={{
                    minWidth: "auto",
                    px: 2,
                  }}
                >
                  {isFetchingTrips
                    ? "Refreshing..."
                    : `Refresh Data (${refreshCountdown})`}
                </Button>
              </Box>
            </Box>
            <Box sx={{ position: "relative" }}>
              <GoogleMap
                markers={mapMarkers}
                onMarkerClick={handleMarkerClick}
                onCustomerMarkerClick={showCustomerInfoWindow}
                selectedTripId={selectedTripId}
                height={isMobile ? "400px" : "600px"}
              />

              {/* Trip Summary Overlay */}
              {selectedTripId && getTripSummary() && (
                <Paper
                  elevation={3}
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    p: isMobile ? 1.5 : 2,
                    minWidth: isMobile ? 180 : 250,
                    maxWidth: isMobile ? "85%" : "auto",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(4px)",
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                    display: { xs: "none", md: "block" },
                  }}
                >
                  <Typography
                    variant={isMobile ? "subtitle2" : "h6"}
                    sx={{ mb: isMobile ? 0.5 : 1, fontWeight: "bold" }}
                  >
                    {selectedTrip?.status === TripStatus.SCHEDULED
                      ? "Trip Yet To Start"
                      : "Trip Summary"}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: isMobile ? 0.5 : 1,
                    }}
                  >
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      color="text.secondary"
                    >
                      Total Direct Deliveries:
                    </Typography>
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      fontWeight="bold"
                    >
                      {getTripSummary()?.totalDeliveries}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: isMobile ? 0.5 : 1,
                    }}
                  >
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      color="success.main"
                    >
                      ✓ Completed:
                    </Typography>
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      fontWeight="bold"
                      color="success.main"
                    >
                      {getTripSummary()?.completedDeliveries}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: isMobile ? 0.5 : 1,
                    }}
                  >
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      color="error.main"
                    >
                      ✗ Failed:
                    </Typography>
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      fontWeight="bold"
                      color="error.main"
                    >
                      {getTripSummary()?.failedDeliveries}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: isMobile ? 0.5 : 1,
                    }}
                  >
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      color="warning.main"
                    >
                      ⏳ Pending:
                    </Typography>
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      fontWeight="bold"
                      color="warning.main"
                    >
                      {getTripSummary()?.pendingDeliveries}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: isMobile ? 0.5 : 1 }} />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: isMobile ? 0.5 : 1,
                    }}
                  >
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      color="info.main"
                    >
                      📦 Lot Dropoffs Pending:
                    </Typography>
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      fontWeight="bold"
                      color="info.main"
                    >
                      {getTripSummary()?.dropoffsPending}
                    </Typography>
                  </Box>

                  {getTripSummary()?.duration && (
                    <>
                      <Divider sx={{ my: isMobile ? 0.5 : 1 }} />

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant={isMobile ? "caption" : "body2"}
                          color="text.secondary"
                        >
                          {getTripSummary()?.durationLabel}
                        </Typography>
                        <Typography
                          variant={isMobile ? "caption" : "body2"}
                          fontWeight="bold"
                        >
                          {getTripSummary()?.duration}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Paper>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Force End Trip Confirmation Dialog */}
      <Dialog
        open={forceEndDialogOpen}
        onClose={handleForceEndDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ bgcolor: "error.main", color: "error.contrastText" }}
        >
          ⚠️ Force End Trip - Warning
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              This action cannot be undone!
            </Typography>
            <Typography variant="body2">
              All pending deliveries will be automatically marked as{" "}
              <strong>UNDELIVERED</strong>. They can be boarded on the next trip
              if needed.
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to force end Trip #{tripToForceEnd}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleForceEndDialogClose}
            disabled={forceEndTripMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleForceEndConfirm}
            disabled={forceEndTripMutation.isPending}
          >
            {forceEndTripMutation.isPending
              ? "Ending Trip..."
              : "Yes, Force End Trip"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleSuccessSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSuccessSnackbarClose}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Loading Spinner for Force End Trip */}
      <ModalInfiniteSpinner
        condition={forceEndTripMutation.isPending}
        title="Force ending trip... Please wait."
      />
    </Box>
  );
};

export default TripDashboard;
