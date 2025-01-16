require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args)); // Use dynamic import for node-fetch

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html with the API key dynamically injected
app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "public", "index.html");
  res.sendFile(filePath, {}, (err) => {
    if (err) {
      console.error("Error serving index.html:", err);
      res.status(500).send("Error loading the page.");
    }
  });
});

// API endpoint to dynamically inject the Google Maps script
app.get("/api/maps", (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const callback = req.query.callback || "initializeMap";
  res.type("application/javascript").send(`
    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callback}";
    document.body.appendChild(script);
  `);
});

// API endpoint for getting 10 random valid Street View points
app.get("/api/streetview", async (req, res) => {
  const CITY_BOUNDS = [
    { name: "Delhi", min_lat: 28.4041, max_lat: 28.8813, min_lon: 76.8371, max_lon: 77.3319 },
    { name: "Mumbai", min_lat: 18.8941, max_lat: 19.2719, min_lon: 72.7757, max_lon: 72.9868 },
    { name: "Bangalore", min_lat: 12.8685, max_lat: 13.1615, min_lon: 77.4913, max_lon: 77.7047 },
    { name: "Kolkata", min_lat: 22.4373, max_lat: 22.7364, min_lon: 88.2444, max_lon: 88.4368 },
    { name: "Chennai", min_lat: 12.8996, max_lat: 13.1434, min_lon: 80.1638, max_lon: 80.3055 },
    { name: "Hyderabad", min_lat: 17.2782, max_lat: 17.5461, min_lon: 78.3498, max_lon: 78.5825 },
    { name: "Pune", min_lat: 18.4321, max_lat: 18.6177, min_lon: 73.7518, max_lon: 73.9842 },
    { name: "Ahmedabad", min_lat: 22.9413, max_lat: 23.1266, min_lon: 72.5021, max_lon: 72.6616 },
    { name: "Jaipur", min_lat: 26.7846, max_lat: 27.0451, min_lon: 75.7333, max_lon: 75.9616 },
    { name: "Lucknow", min_lat: 26.7674, max_lat: 27.0113, min_lon: 80.8170, max_lon: 81.0296 },
  ];

  function getRandomCoordinates() {
    const city = CITY_BOUNDS[Math.floor(Math.random() * CITY_BOUNDS.length)];
    const lat = Math.random() * (city.max_lat - city.min_lat) + city.min_lat;
    const lon = Math.random() * (city.max_lon - city.min_lon) + city.min_lon;
    console.log(`Generated coordinates for ${city.name}: { lat: ${lat}, lon: ${lon} }`);
    return { lat, lon, city: city.name };
  }

  async function validateStreetView(lat, lon) {
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lon}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.status === "OK";
    } catch (error) {
      console.error("Error validating Street View:", error);
      return false;
    }
  }

  async function getStreetViewPoints() {
    const points = [];
    const maxPoints = 10;

    while (points.length < maxPoints) {
      try {
        const coords = getRandomCoordinates();
        const isValid = await validateStreetView(coords.lat, coords.lon);
        if (isValid) {
          console.log(`Valid coordinates added: ${JSON.stringify(coords)}`);
          points.push(coords);
        } else {
          console.log(`No Street View available for: ${JSON.stringify(coords)}`);
        }
      } catch (error) {
        console.error("Error generating Street View point:", error);
      }
    }

    return points;
  }

  try {
    const points = await getStreetViewPoints();
    res.json(points);
  } catch (error) {
    console.error("Error fetching Street View points:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
