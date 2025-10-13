import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import RouteIcon from "@mui/icons-material/AltRoute";
import ProfileHeader from "../../common/ProfileHeader";
const DistanceToClientMap = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const routeLayer = useRef(null);
  const liveMarker = useRef(null);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [liveCoords, setLiveCoords] = useState(null);

  // Initialize Map
  useEffect(() => {
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      }).addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // 🧭 Detect & Track User’s Live Location
  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by this browser.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstance.current.setView([latitude, longitude], 13);

        // Reverse geocode using Photon (CORS-friendly)
        try {
          const res = await fetch(
            `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const address =
            data.features?.[0]?.properties?.name ||
            data.features?.[0]?.properties?.city ||
            data.features?.[0]?.properties?.country ||
            "Unknown Location";

          setOrigin(address);
          setLiveCoords({ lat: latitude, lng: longitude });

          if (liveMarker.current) mapInstance.current.removeLayer(liveMarker.current);

          liveMarker.current = L.marker([latitude, longitude], {
            title: "Your Live Location",
          })
            .addTo(mapInstance.current)
            .bindPopup(`<b>Your Location</b><br>${address}`)
            .openPopup();
        } catch (err) {
          console.error(err);
          alert("Unable to fetch address for your current location.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setLoading(false);
        alert("Unable to detect your location. Please allow GPS access.");
      }
    );

    // Start continuous tracking (live updates)
    navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLiveCoords({ lat: latitude, lng: longitude });

        if (liveMarker.current)
          liveMarker.current.setLatLng([latitude, longitude]);
      },
      (err) => console.error("Live tracking error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 🌍 Forward Geocode using Photon
  const geocodeLocation = async (address) => {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await res.json();
    if (!data.features || !data.features.length)
      throw new Error("Address not found.");

    const coords = data.features[0].geometry.coordinates;
    return { lat: coords[1], lng: coords[0] };
  };

  // 🕒 Convert seconds to hours and minutes
  const formatDuration = (seconds) => {
    const totalMinutes = Math.round(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) return `${hours} hr ${minutes} min`;
    return `${minutes} min`;
  };

  // 🚗 Calculate Route using OSRM
  const handleGetDistance = async (silent = false) => {
    if ((!origin && !liveCoords) || !destination) {
      if (!silent) alert("Please enter both origin and destination.");
      return;
    }

    if (!silent) setLoading(true);

    try {
      const originCoords = liveCoords || (await geocodeLocation(origin));
      const destCoords = await geocodeLocation(destination);

      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson`
      );
      const data = await res.json();

      if (!data.routes || !data.routes.length)
        throw new Error("No route found.");

      const route = data.routes[0];
      const distanceKm = (route.distance / 1000).toFixed(2);
      const durationFormatted = formatDuration(route.duration);

      setDistance(`${distanceKm} km`);
      setDuration(durationFormatted);
      setLastUpdated(new Date().toLocaleTimeString());

      const routeCoords = route.geometry.coordinates.map((c) => [c[1], c[0]]);

      if (routeLayer.current)
        mapInstance.current.removeLayer(routeLayer.current);

      routeLayer.current = L.polyline(routeCoords, {
        color: "#1976d2",
        weight: 5,
      }).addTo(mapInstance.current);

      // Add markers
      L.marker([originCoords.lat, originCoords.lng])
        .addTo(mapInstance.current)
        .bindPopup("Start Location");

      L.marker([destCoords.lat, destCoords.lng])
        .addTo(mapInstance.current)
        .bindPopup("Destination");

      mapInstance.current.fitBounds(routeLayer.current.getBounds());
    } catch (err) {
      console.error(err);
      if (!silent) alert(err.message || "Unable to fetch route.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // 🔁 Auto-refresh ETA every 30 seconds (like Google Maps Live ETA)
  useEffect(() => {
    if (!destination) return;
    const interval = setInterval(() => {
      if (liveCoords || origin) handleGetDistance(true);
    }, 30000); // update every 30s

    return () => clearInterval(interval);
  }, [destination, liveCoords, origin]);

  return (
    <>
    <ProfileHeader/>
    <Box sx={{ mx: "auto", mt: 3 }}>
      <Card
        sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          mb: 2,
          background: "#fff",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2,
            color: "#1565c0",
            fontWeight: 600,
          }}
        >
          <RouteIcon /> Real-Time Distance to Client
        </Typography>

        <Button
          onClick={handleUseMyLocation}
          variant="outlined"
          startIcon={<MyLocationIcon />}
          disabled={loading}
          sx={{
            mb: 2,
            borderColor: "#1565c0",
            color: "#1565c0",
            "&:hover": { borderColor: "#0d47a1", color: "#0d47a1" },
          }}
        >
          {loading ? "Detecting..." : "Use My Current Location"}
        </Button>

        <TextField
          fullWidth
          label="Start Location"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <MyLocationIcon sx={{ mr: 1, color: "#1565c0" }} />,
          }}
        />

        <TextField
          fullWidth
          label="Client Location"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <LocationOnIcon sx={{ mr: 1, color: "#1565c0" }} />
            ),
          }}
        />

        <Button
          variant="contained"
          onClick={() => handleGetDistance(false)}
          disabled={loading}
          sx={{
            py: 1.2,
            borderRadius: 2,
            fontWeight: 600,
            background: "linear-gradient(135deg, #1976d2, #64b5f6)",
          }}
        >
          {loading ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            <>
              <RouteIcon sx={{ mr: 1 }} /> Get Distance & Route
            </>
          )}
        </Button>

        {distance && (
          <Box
            sx={{
              mt: 3,
              backgroundColor: "#e3f2fd",
              borderRadius: 2,
              p: 2,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontWeight: 600, color: "#0d47a1" }}>
              🛣️ Distance: {distance}
            </Typography>
            <Typography sx={{ color: "#1565c0", fontWeight: 500 }}>
              ⏱️ ETA (Live): {duration}
            </Typography>
            <Typography sx={{ color: "#757575", fontSize: 13, mt: 0.5 }}>
              Last updated: {lastUpdated}
            </Typography>
          </Box>
        )}
      </Card>

      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "500px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      />
    </Box>
    </>
  );
};

export default DistanceToClientMap;
