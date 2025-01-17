require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args)); // Use dynamic import for node-fetch

const app = express();

// Predefined list of Akola landmarks and coordinates
const akolaLocations = [
  { name: "राज राजेश्वर मंदिर", lat: 20.7048, lon: 77.0170 },
  { name: "जठारपेठ", lat: 20.7112, lon: 77.0235 },
  { name: "अकोला बाजार", lat: 20.7053, lon: 77.0185 },
  { name: "मोठी उमरी", lat: 20.7184, lon: 77.0160 },
  { name: "गांधी चौक", lat: 20.7010, lon: 77.0195 },
  { name: "रेल्वे स्टेशन चौक", lat: 20.7092, lon: 77.0213 },
  { name: "कौलखेड चौक", lat: 20.7105, lon: 77.0165 },
  { name: "बस स्थानक", lat: 20.7058, lon: 77.0148 },
  { name: "टॉवर चौक", lat: 20.7118, lon: 77.0122 },
  { name: "ट्युशन एरिया", lat: 20.7135, lon: 77.0198 }
];

// Function to generate signed URLs for Google Maps API
function generateSignedUrl(path, secret) {
  const decodedSecret = Buffer.from(secret, "base64");
  const signature = crypto
    .createHmac("sha1", decodedSecret)
    .update(path)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${path}&signature=${signature}`;
}

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Serve the Google Maps API script with signed URLs
app.get("/api/maps", (req, res) => {
  const basePath = "/maps/api/js";
  const params = `key=${process.env.GOOGLE_MAPS_API_KEY}&callback=${req.query.callback || "initializeMap"}`;
  const signedUrl = generateSignedUrl(`${basePath}?${params}`, process.env.SIGNING_SECRET);

  res.type("application/javascript").send(`
    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com${signedUrl}";
    document.body.appendChild(script);
  `);
});

// API endpoint to generate random coordinates within Akola bounds and return predefined points
app.get("/api/streetview", async (req, res) => {
  // Akola coordinates bounds
  const AKOLA_BOUNDS = {
    min_lat: 20.6980,
    max_lat: 20.7250,
    min_lon: 77.0100,
    max_lon: 77.0250
  };

  // Function to generate random coordinates within Akola bounds
  function getRandomCoordinates() {
    const lat = Math.random() * (AKOLA_BOUNDS.max_lat - AKOLA_BOUNDS.min_lat) + AKOLA_BOUNDS.min_lat;
    const lon = Math.random() * (AKOLA_BOUNDS.max_lon - AKOLA_BOUNDS.min_lon) + AKOLA_BOUNDS.min_lon;
    console.log(`Generated random coordinates: { lat: ${lat}, lon: ${lon} }`);
    return { lat, lon };
  }

  // Function to validate if a location has street view
  async function validateStreetView(lat, lon) {
    const basePath = "/maps/api/streetview/metadata";
    const params = `location=${lat},${lon}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const signedUrl = generateSignedUrl(`${basePath}?${params}`, process.env.SIGNING_SECRET);

    try {
      const response = await fetch(`https://maps.googleapis.com${signedUrl}`);
      const data = await response.json();
      // Only fetch images where Street View exists and is verified by Google
      return data.status === "OK" && data.copyright === "© Google";
    } catch (error) {
      console.error("Error validating Street View:", error);
      return false;
    }
  }

  // Function to get a mix of random and predefined points
  async function getStreetViewPoints() {
    const points = [];
    const maxPoints = 10;

    // First, add some random coordinates
    while (points.length < maxPoints / 2) {
      const coords = getRandomCoordinates();
      const isValid = await validateStreetView(coords.lat, coords.lon);
      if (isValid) {
        console.log(`Valid random coordinates added: ${JSON.stringify(coords)}`);
        points.push({ lat: coords.lat, lon: coords.lon, name: "Random Location" });
      } else {
        console.log(`No Street View available for random location: ${JSON.stringify(coords)}`);
      }
    }

    // Then, add predefined Akola points
    akolaLocations.forEach(location => {
      points.push({
        lat: location.lat,
        lon: location.lon,
        name: location.name
      });
    });

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

