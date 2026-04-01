import { useEffect, useState } from "react";

function WeatherMonitor() {
  const [weather, setWeather] = useState(null);
  const [alert, setAlert] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    // Get user location and weather
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // Get location name using reverse geocoding
        try {
          const locationResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );
          const locationData = await locationResponse.json();
          setUserLocation(locationData.display_name || "Current Location");
        } catch (error) {
          console.error("Location fetch error:", error);
          setUserLocation("Location unavailable");
        }

        // Get weather data
        try {
          const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=654de9dba0a42ac07e6dd0a2a36dbb99&units=metric`
          );
          const weatherData = await weatherResponse.json();
          setWeather(weatherData);

          const condition = weatherData.weather[0].main;
          
          // Auto-claim logic
          if (condition === "Rain" || condition === "Thunderstorm" || condition === "Extreme") {
            setAlert(true);
            handleAutoClaim(condition, weatherData);
          }
        } catch (error) {
          console.error("Weather fetch error:", error);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setUserLocation("Location access denied");
      }
    );

    // Load existing claims
    const existingClaims = JSON.parse(localStorage.getItem("autoClaims") || "[]");
    setClaims(existingClaims);
  }, []);

  const handleAutoClaim = (condition, weatherData) => {
    const newClaim = {
      id: Date.now(),
      date: new Date().toISOString(),
      condition: condition,
      temperature: weatherData.main.temp,
      location: userLocation,
      status: "Auto-Triggered",
      amount: calculateClaimAmount(condition)
    };

    const updatedClaims = [newClaim, ...claims];
    setClaims(updatedClaims);
    localStorage.setItem("autoClaims", JSON.stringify(updatedClaims));
  };

  const calculateClaimAmount = (condition) => {
    switch(condition) {
      case "Rain": return 3000;
      case "Thunderstorm": return 5000;
      case "Extreme": return 8000;
      default: return 2000;
    }
  };

  return (
    <div className="weather-container">
      <div className="card">
        <h2>🌤️ Weather Monitor & Auto-Claims</h2>
        
        {weather && (
          <div className="weather-info">
            <div className="location-info">
              <h3>📍 Current Location</h3>
              <p>{userLocation}</p>
            </div>

            <div className="current-weather">
              <div className="weather-main">
                <h3>{weather.weather[0].main}</h3>
                <p className="temperature">{weather.main.temp}°C</p>
                <p className="description">{weather.weather[0].description}</p>
              </div>
              
              <div className="weather-details">
                <div className="detail-item">
                  <span>💧 Humidity:</span>
                  <span>{weather.main.humidity}%</span>
                </div>
                <div className="detail-item">
                  <span>💨 Wind:</span>
                  <span>{weather.wind.speed} m/s</span>
                </div>
                <div className="detail-item">
                  <span>🌡️ Feels like:</span>
                  <span>{weather.main.feels_like}°C</span>
                </div>
              </div>
            </div>

            {alert && (
              <div className="weather-alert">
                <h3>⚠️ Auto-Claim Triggered!</h3>
                <p>Bad weather detected: {weather.weather[0].main}</p>
                <p>Claim amount: ₹{calculateClaimAmount(weather.weather[0].main)}</p>
                <p>Status: Processing</p>
              </div>
            )}
          </div>
        )}

        <div className="auto-claims-history">
          <h3>📋 Auto-Claims History</h3>
          {claims.length > 0 ? (
            <div className="claims-list">
              {claims.map(claim => (
                <div key={claim.id} className="claim-item">
                  <div className="claim-header">
                    <span className="claim-date">{new Date(claim.date).toLocaleDateString()}</span>
                    <span className={`claim-status ${claim.status.toLowerCase().replace('-', '')}`}>
                      {claim.status}
                    </span>
                  </div>
                  <div className="claim-details">
                    <p><strong>Condition:</strong> {claim.condition}</p>
                    <p><strong>Location:</strong> {claim.location}</p>
                    <p><strong>Amount:</strong> ₹{claim.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No auto-claims triggered yet</p>
          )}
        </div>

        <div className="weather-actions">
          <button className="action-btn">Manual Claim</button>
          <button className="action-btn">Weather Alerts Settings</button>
        </div>
      </div>
    </div>
  );
}

export default WeatherMonitor;
