let panorama; // Street View instance
let score = 0; // User's score
let points = []; // List of Street View points
let currentIndex = 0; // Current point index
let currentChoice = null; // Tracks the current choice (yes or no)

// Initialize the Street View map
function initializeMap() {
  const mapContainer = document.getElementById("map");
  panorama = new google.maps.StreetViewPanorama(mapContainer, {
    pov: { heading: 34, pitch: 10 },
    visible: false, // Initially hidden
  });
}

// Start the game
async function startGame() {
  const startScreen = document.getElementById("start-screen");
  const gameContainer = document.getElementById("game-container");
  const gameControls = document.getElementById("game-controls");
  const mapContainer = document.getElementById("map");

  // Disable Start Button and show loading
  const startButton = document.getElementById("start-button");
  startButton.disabled = true;
  startButton.textContent = "Loading...";

  try {
    // Fetch Street View points from the backend
    const response = await fetch("/api/streetview");
    points = await response.json();

    if (points.length > 0) {
      // Show the first point
      currentIndex = 0;
      loadStreetView(points[currentIndex]);

      // Hide the Start Screen and display the Game UI
      startScreen.style.display = "none";
      gameContainer.style.display = "block";
      gameControls.style.display = "block";
      mapContainer.style.display = "block";

      // Reset Start Button for future use
      startButton.disabled = false;
      startButton.textContent = "START GAME";
    } else {
      console.error("No valid points received from the backend.");
      alert("No locations available. Please try again later.");
    }
  } catch (error) {
    console.error("Error starting game:", error);
    startButton.disabled = false;
    startButton.textContent = "START GAME";
    alert("Error starting the game. Please try again later.");
  }
}

// Load a specific Street View point
function loadStreetView(point) {
  panorama.setPosition({ lat: point.lat, lng: point.lon });
  panorama.setVisible(true);

  // Enable the Yes and No buttons
  const yesButton = document.getElementById("yes-button");
  const noButton = document.getElementById("no-button");
  yesButton.disabled = false;
  noButton.disabled = false;
  yesButton.style.backgroundColor = "#ff6600"; // Reset color
  noButton.style.backgroundColor = "#ff6600"; // Reset color

  // Hide the Next button until a choice is made
  document.getElementById("next-button").style.display = "none";

  currentChoice = null; // Reset choice for the new location
}

// Handle the "Yes" button click
function chooseYes() {
  currentChoice = "yes";
  updateButtonStyles("yes");
}

// Handle the "No" button click
function chooseNo() {
  currentChoice = "no";
  updateButtonStyles("no");
}

// Update button styles based on the current choice
function updateButtonStyles(choice) {
  const yesButton = document.getElementById("yes-button");
  const noButton = document.getElementById("no-button");

  // Grey out both buttons
  yesButton.style.backgroundColor = choice === "yes" ? "#999" : "#444";
  noButton.style.backgroundColor = choice === "no" ? "#999" : "#444";

  // Allow toggling
  yesButton.disabled = false;
  noButton.disabled = false;

  // Show the Next button
  document.getElementById("next-button").style.display = "inline-block";
}

// Handle the "Next" button click
function nextPoint() {
  if (currentChoice === "yes") {
    score++;
  }
  document.getElementById("score").textContent = score;

  currentIndex++;
  if (currentIndex < points.length) {
    loadStreetView(points[currentIndex]);
  } else {
    endGame();
  }
}

// End the game
function endGame() {
  // Hide the map and game controls
  document.getElementById("map").style.display = "none";
  document.getElementById("game-controls").style.display = "none";

  // Display the end screen
  const endScreen = document.getElementById("end-screen");
  endScreen.style.display = "block";

  // Update the final score
  document.getElementById("final-score").textContent = score;

  // Restart button logic
  document.getElementById("restart-button").addEventListener("click", () => {
    location.reload();
  });
}

// Attach event listeners
document.getElementById("start-button").addEventListener("click", startGame);
document.getElementById("yes-button").addEventListener("click", chooseYes);
document.getElementById("no-button").addEventListener("click", chooseNo);
document.getElementById("next-button").addEventListener("click", nextPoint);
