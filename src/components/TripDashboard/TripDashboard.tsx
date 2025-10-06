import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "@mui/material";
import {
  DirectionsCar,
  Person,
  Schedule,
  LocationOn,
  CheckCircle,
  Cancel,
  Warning,
  ConfirmationNumber,
} from "@mui/icons-material";
import { useApiService } from "../../hooks/useApiService";
import {
  Trip,
  AllTripsResponse,
  TripStatus,
  DocStatus,
  MapMarker,
} from "../../types/Trip";
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
  height: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  markers,
  onMarkerClick,
  height,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    // Initialize map
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: 9.9312, lng: 76.2673 }, // Kochi, Kerala as default center
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
    });

    mapInstanceRef.current = map;

    return () => {
      // Cleanup markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map: mapInstanceRef.current,
        title: markerData.title,
        icon: getMarkerIcon(markerData),
      });

      // Add click listener
      marker.addListener("click", () => {
        if (markerData.tripId) {
          onMarkerClick(markerData.tripId);
        }
      });

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
      url:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="12" fill="#1976d2" stroke="white" stroke-width="2"/>
          <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">D</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(32, 32),
      anchor: new window.google.maps.Point(16, 16),
    };
  }

  // Customer marker colors based on status
  let color = "#ff9800"; // Default yellow for ON_TRIP/AT_TRANSIT_HUB
  if (marker.status === DocStatus.DELIVERED) {
    color = "#4caf50"; // Green
  } else if (marker.status === DocStatus.UNDELIVERED) {
    color = "#f44336"; // Red
  }

  return {
    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
      </svg>
    `),
    scaledSize: new window.google.maps.Size(24, 24),
    anchor: new window.google.maps.Point(12, 12),
  };
};

// Trip card component
interface TripCardProps {
  trip: Trip;
  isSelected: boolean;
  onClick: () => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, isSelected, onClick }) => {
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
            {trip.route}
          </Typography>
          <Chip
            icon={getStatusIcon(trip.status)}
            label={trip.status}
            color={getStatusColor(trip.status)}
            size="small"
          />
        </Box>

        {!isExpanded && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
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
              Created: {new Date(trip.createdAt).toLocaleString()}
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              Last Updated: {new Date(trip.lastUpdatedAt).toLocaleString()}
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
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
  const { get } = useApiService();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);

  // Fetch all trips
  const {
    data: allTripsData,
    isLoading: tripsLoading,
    isError: tripsError,
    error: tripsErrorMsg,
  } = useQuery<AllTripsResponse>({
    queryKey: ["all-trips"],
    queryFn: () => get(API_ENDPOINTS.ALL_TRIPS),
  });

  // Fetch selected trip details
  const { data: selectedTrip, isLoading: tripDetailLoading } = useQuery<Trip>({
    queryKey: ["trip-detail", selectedTripId],
    queryFn: () => get(API_ENDPOINTS.TRIP_DETAIL(selectedTripId!)),
    enabled: !!selectedTripId,
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
  const handleMarkerClick = (tripId: number) => {
    if (selectedTripId === tripId) {
      // If clicking on the already selected trip marker, deselect it
      setSelectedTripId(null);
    } else {
      // Select the new trip
      setSelectedTripId(tripId);
    }
  };

  // Generate map markers
  useEffect(() => {
    if (!allTripsData?.trips) return;

    const markers: MapMarker[] = [];

    allTripsData.trips.forEach((trip) => {
      // Add driver marker if coordinates are available
      if (trip.driverLastKnownLatitude && trip.driverLastKnownLongitude) {
        markers.push({
          id: `driver-${trip.tripId}`,
          position: {
            lat: parseFloat(trip.driverLastKnownLatitude),
            lng: parseFloat(trip.driverLastKnownLongitude),
          },
          type: "driver",
          title: `${trip.driverName} - ${trip.vehicleNumber}`,
          tripId: trip.tripId,
        });
      }
    });

    setMapMarkers(markers);
  }, [allTripsData]);

  // Add customer markers when trip is selected and has details
  useEffect(() => {
    if (!selectedTrip?.docGroups) return;

    const customerMarkers: MapMarker[] = [];

    selectedTrip.docGroups.forEach((docGroup) => {
      docGroup.docs.forEach((doc) => {
        if (doc.customerGeoLatitude && doc.customerGeoLongitude) {
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

    setMapMarkers((prev) => [
      ...prev.filter((m) => m.type === "driver"),
      ...customerMarkers,
    ]);
  }, [selectedTrip]);

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
            <Typography variant="h6" sx={{ mb: 2 }}>
              Active Trips ({trips.length})
            </Typography>
            <Box
              sx={{ maxHeight: isMobile ? "300px" : "600px", overflow: "auto" }}
            >
              {trips.length === 0 ? (
                <Alert severity="info">
                  No trips found. Showing all driver locations on map.
                </Alert>
              ) : (
                trips.map((trip) => (
                  <Box key={trip.tripId} sx={{ mb: 2 }}>
                    <TripCard
                      trip={trip}
                      isSelected={selectedTripId === trip.tripId}
                      onClick={() => handleTripSelect(trip.tripId)}
                    />
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Box>

        {/* Google Map */}
        <Box sx={{ flex: { xs: "1", md: "0 0 67%" } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {selectedTripId
                ? `Trip #${selectedTripId} Map`
                : "Driver Locations"}
            </Typography>
            <Box sx={{ position: "relative" }}>
              <GoogleMap
                markers={mapMarkers}
                onMarkerClick={handleMarkerClick}
                height={isMobile ? "400px" : "600px"}
              />
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default TripDashboard;
