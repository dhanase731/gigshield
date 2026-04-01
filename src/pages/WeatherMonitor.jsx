import { useEffect, useRef, useState } from "react";

const WEATHER_POLL_INTERVAL_MS = 120000;
const DEFAULT_RISK_CONFIG = {
  windSpeedThreshold: 15,
  rainVolumeThreshold: 20,
  earthquakeMagnitudeThreshold: 4.5,
  treatRainAsEmergency: true,
};

const DEFAULT_ORDERS = [
  { id: "ORD-1001", customer: "Rajesh K.", area: "Central Market", status: "Active", value: 320 },
  { id: "ORD-1002", customer: "Priya S.", area: "North Avenue", status: "Active", value: 180 },
  { id: "ORD-1003", customer: "Arun M.", area: "Lake Road", status: "Active", value: 260 },
];

function WeatherMonitor() {
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [claims, setClaims] = useState(() => JSON.parse(localStorage.getItem("autoClaims") || "[]"));
  const [orders, setOrders] = useState(() => {
    const existing = localStorage.getItem("activeOrders");
    if (existing) {
      return JSON.parse(existing);
    }
    localStorage.setItem("activeOrders", JSON.stringify(DEFAULT_ORDERS));
    return DEFAULT_ORDERS;
  });
  const [notificationEnabled, setNotificationEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );
  const [riskConfig, setRiskConfig] = useState(() => {
    const existing = localStorage.getItem("riskConfig");
    if (existing) {
      return JSON.parse(existing);
    }
    return DEFAULT_RISK_CONFIG;
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const lastAlertSignatureRef = useRef(null);
  const weatherApiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  const hasValidWeatherKey = Boolean(weatherApiKey) && !String(weatherApiKey).startsWith("replace_");

  const calculateClaimAmount = (condition) => {
    switch(condition) {
      case "Rain": return 3000;
      case "Thunderstorm": return 5000;
      case "Extreme": return 8000;
      default: return 2000;
    }
  };

  const buildSafetyAdvice = (eventLabel) => {
    return [
      `Live risk detected: ${eventLabel}.`,
      "Stay indoors or move to the nearest safe shelter.",
      "Avoid waterlogged roads, trees, and open spaces.",
      "Pause deliveries until local conditions are declared safe.",
      "Keep your phone charged and emergency contacts reachable.",
    ];
  };

  const triggerBrowserNotification = (title, body) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }

    new Notification(title, { body });
  };

  const triggerAlertBox = (risk, locationLabel, force = false) => {
    const signature = `${risk.source}|${risk.event}|${locationLabel}`;
    if (!force && lastAlertSignatureRef.current === signature) {
      return;
    }

    lastAlertSignatureRef.current = signature;
    window.alert(
      `DISPATCH ALERT: ${risk.event} at ${locationLabel}.\nAction: Orders cancelled. Move to safe zone now.\nSource: ${risk.source}.`
    );
  };

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") {
      window.alert("Browser notifications are not supported on this device.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationEnabled(permission === "granted");
  };

  const cancelAllActiveOrders = (reason) => {
    setOrders((prevOrders) => {
      const updated = prevOrders.map((order) => {
        if (order.status !== "Active") {
          return order;
        }

        return {
          ...order,
          status: "Cancelled",
          cancellationReason: reason,
          cancelledAt: new Date().toISOString(),
        };
      });

      localStorage.setItem("activeOrders", JSON.stringify(updated));
      return updated;
    });
  };

  const restoreCancelledOrders = () => {
    setOrders((prevOrders) => {
      const restored = prevOrders.map((order) => {
        if (order.status !== "Cancelled") {
          return order;
        }

        return {
          ...order,
          status: "Active",
          cancellationReason: undefined,
          cancelledAt: undefined,
        };
      });

      localStorage.setItem("activeOrders", JSON.stringify(restored));
      return restored;
    });

    triggerBrowserNotification(
      "Orders Restored",
      "Cancelled orders were restored manually by the user."
    );
  };

  const triggerSimulatedEmergency = (eventType) => {
    const locationLabel = userLocation || "Simulated Zone";
    const simulatedWeatherData = weather || {
      weather: [{ main: eventType }],
      main: { temp: 30, humidity: 70, feels_like: 33 },
      wind: { speed: 8 },
    };

    const simulatedRisk = {
      source: "Simulation",
      event: eventType,
      summary: `Simulation mode: ${eventType} risk has been triggered manually.`,
      safetyAdvice: buildSafetyAdvice(eventType),
    };

    setAlert({
      ...simulatedRisk,
      location: locationLabel,
      generatedAt: new Date().toISOString(),
    });

    triggerAlertBox(simulatedRisk, locationLabel, true);

    setWeather(simulatedWeatherData);
    setLastUpdated(new Date().toISOString());
    cancelAllActiveOrders(simulatedRisk.summary);

    const newClaim = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      condition: eventType,
      temperature: simulatedWeatherData.main.temp,
      location: locationLabel,
      status: "Simulation-Triggered",
      amount: calculateClaimAmount(eventType),
    };

    setClaims((prevClaims) => {
      const updatedClaims = [newClaim, ...prevClaims];
      localStorage.setItem("autoClaims", JSON.stringify(updatedClaims));
      return updatedClaims;
    });

    triggerBrowserNotification(
      "Simulation Alert: Orders Cancelled",
      `${eventType} simulation triggered. Active orders were cancelled for safety drill.`
    );
  };

  const clearEmergencyAlert = () => {
    setAlert(null);
    lastAlertSignatureRef.current = null;
  };

  const handleRiskConfigChange = (field, value) => {
    setRiskConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const buildMapUrl = () => {
    if (!coordinates) {
      return null;
    }

    const { lat, lon } = coordinates;
    const delta = 0.02;
    const bbox = `${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
  };

  useEffect(() => {
    if (!hasValidWeatherKey) {
      const message = "Weather API key is missing or still set to placeholder. Update VITE_OPENWEATHER_API_KEY in .env.";
      console.error(message);
      setWeatherError(message);
      return;
    }

    setWeatherError(null);

    const handleAutoClaim = (condition, weatherData, locationLabel) => {
      const newClaim = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        condition,
        temperature: weatherData.main.temp,
        location: locationLabel,
        status: "Auto-Triggered",
        amount: calculateClaimAmount(condition)
      };

      setClaims((prevClaims) => {
        const updatedClaims = [newClaim, ...prevClaims];
        localStorage.setItem("autoClaims", JSON.stringify(updatedClaims));
        return updatedClaims;
      });
    };

    const triggerEmergencyWorkflow = (risk, weatherData, locationLabel) => {
      setAlert({
        ...risk,
        location: locationLabel,
        generatedAt: new Date().toISOString(),
      });

      triggerAlertBox(risk, locationLabel);

      cancelAllActiveOrders(risk.summary);

      handleAutoClaim(risk.event, weatherData, locationLabel);
      triggerBrowserNotification(
        "Emergency Alert: Orders Cancelled",
        `${risk.summary} All active orders were cancelled. Stay in a safe zone.`
      );
    };

    const detectWeatherRisk = (weatherData) => {
      const condition = weatherData.weather?.[0]?.main || "Unknown";
      const windSpeed = weatherData.wind?.speed || 0;
      const rainVolume = weatherData.rain?.["1h"] || 0;
      const severeConditions = ["Thunderstorm", "Squall", "Tornado", "Ash", "Extreme"];

      const isWeatherEmergency =
        severeConditions.includes(condition) ||
        (riskConfig.treatRainAsEmergency && condition === "Rain") ||
        windSpeed >= riskConfig.windSpeedThreshold ||
        rainVolume >= riskConfig.rainVolumeThreshold;

      if (!isWeatherEmergency) {
        return null;
      }

      return {
        source: "Weather",
        event: condition,
        summary: `${condition} detected with live risk factors.`,
        safetyAdvice: buildSafetyAdvice(condition),
      };
    };

    const detectEarthquakeRisk = async (lat, lon) => {
      try {
        const earthquakeResponse = await fetch(
          `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=250&minmagnitude=${riskConfig.earthquakeMagnitudeThreshold}&orderby=time&limit=1`
        );

        const earthquakeData = await earthquakeResponse.json();
        const quake = earthquakeData.features?.[0];

        if (!quake) {
          return null;
        }

        const magnitude = quake.properties?.mag;
        const place = quake.properties?.place || "nearby region";

        return {
          source: "Disaster",
          event: "Earthquake",
          summary: `Earthquake M${magnitude} reported near ${place}.`,
          safetyAdvice: buildSafetyAdvice("Earthquake"),
        };
      } catch (error) {
        console.error("Earthquake feed error:", error);
        return null;
      }
    };

    let intervalId;

    // Get user location and weather
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoordinates({ lat, lon });
        let locationLabel = "Current Location";

        const fetchRiskStatus = async () => {
          // Get location name using reverse geocoding
          try {
            const locationResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
            );
            const locationData = await locationResponse.json();
            locationLabel = locationData.display_name || "Current Location";
            setUserLocation(locationLabel);
          } catch (error) {
            console.error("Location fetch error:", error);
            locationLabel = "Location unavailable";
            setUserLocation(locationLabel);
          }

          // Get weather data
          try {
            const weatherResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`
            );

            if (!weatherResponse.ok) {
              if (weatherResponse.status === 401) {
                throw new Error("OpenWeather authorization failed (401). Please use a valid API key in .env.");
              }
              throw new Error(`Weather service error: ${weatherResponse.status}`);
            }

            const weatherData = await weatherResponse.json();

            if (!weatherData?.weather?.[0] || !weatherData?.main) {
              throw new Error("Weather response is incomplete. Please try again.");
            }

            setWeather(weatherData);
            setLastUpdated(new Date().toISOString());
            setWeatherError(null);

            const weatherRisk = detectWeatherRisk(weatherData);
            const earthquakeRisk = await detectEarthquakeRisk(lat, lon);
            const activeRisk = weatherRisk || earthquakeRisk;

            if (activeRisk) {
              triggerEmergencyWorkflow(activeRisk, weatherData, locationLabel);
            } else {
              setAlert(null);
            }
          } catch (error) {
            console.error("Weather fetch error:", error);
            setWeatherError(error.message || "Unable to load weather data right now.");
          }
        };

        await fetchRiskStatus();
        intervalId = setInterval(fetchRiskStatus, WEATHER_POLL_INTERVAL_MS);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setUserLocation("Location access denied");
      }
    );

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [weatherApiKey, riskConfig, hasValidWeatherKey]);

  useEffect(() => {
    localStorage.setItem("riskConfig", JSON.stringify(riskConfig));
  }, [riskConfig]);

  const mapUrl = buildMapUrl();
  const activeOrdersCount = orders.filter((order) => order.status === "Active").length;
  const cancelledOrdersCount = orders.filter((order) => order.status === "Cancelled").length;
  const weatherMain = weather?.weather?.[0]?.main || "Unknown";
  const weatherDescription = weather?.weather?.[0]?.description || "No weather description available";
  const weatherTemp = weather?.main?.temp;
  const weatherHumidity = weather?.main?.humidity;
  const weatherWind = weather?.wind?.speed;
  const weatherFeelsLike = weather?.main?.feels_like;

  return (
    <div className="weather-container">
      <div className="card">
        <h2>Weather Monitor, Map and Emergency Actions</h2>

        <div className="weather-top-actions">
          <button className="action-btn" onClick={enableNotifications}>
            {notificationEnabled ? "Notifications Enabled" : "Enable Emergency Notifications"}
          </button>
          <span className="sync-time">
            Last update: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Waiting for live data"}
          </span>
        </div>

        {weatherError && (
          <div className="weather-alert">
            <h3>Weather Data Unavailable</h3>
            <p>{weatherError}</p>
          </div>
        )}

        <div className="simulation-actions">
          <button className="action-btn" onClick={() => triggerSimulatedEmergency("Rain")}>
            Simulate Rain Emergency
          </button>
          <button className="action-btn" onClick={() => triggerSimulatedEmergency("Earthquake")}>
            Simulate Earthquake Emergency
          </button>
          <button className="action-btn" onClick={clearEmergencyAlert}>
            Clear Emergency Alert
          </button>
        </div>

        <div className="risk-controls">
          <h3>Risk Threshold Settings</h3>
          <div className="risk-grid">
            <label>
              Wind threshold (m/s)
              <input
                type="number"
                min="1"
                step="0.5"
                value={riskConfig.windSpeedThreshold}
                onChange={(e) => handleRiskConfigChange("windSpeedThreshold", Number(e.target.value))}
              />
            </label>

            <label>
              Rain threshold (mm/hr)
              <input
                type="number"
                min="1"
                step="1"
                value={riskConfig.rainVolumeThreshold}
                onChange={(e) => handleRiskConfigChange("rainVolumeThreshold", Number(e.target.value))}
              />
            </label>

            <label>
              Earthquake magnitude threshold
              <input
                type="number"
                min="3"
                step="0.1"
                value={riskConfig.earthquakeMagnitudeThreshold}
                onChange={(e) => handleRiskConfigChange("earthquakeMagnitudeThreshold", Number(e.target.value))}
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={riskConfig.treatRainAsEmergency}
                onChange={(e) => handleRiskConfigChange("treatRainAsEmergency", e.target.checked)}
              />
              Treat rain as emergency condition
            </label>
          </div>
        </div>
        
        {weather && (
          <div className="weather-info">
            <div className="location-info">
              <h3>Current Location</h3>
              <p>{userLocation}</p>
            </div>

            <div className="current-weather">
              <div className="weather-main">
                <h3>{weatherMain}</h3>
                <p className="temperature">{typeof weatherTemp === "number" ? `${weatherTemp}°C` : "--"}</p>
                <p className="description">{weatherDescription}</p>
              </div>
              
              <div className="weather-details">
                <div className="detail-item">
                  <span>Humidity:</span>
                  <span>{typeof weatherHumidity === "number" ? `${weatherHumidity}%` : "--"}</span>
                </div>
                <div className="detail-item">
                  <span>Wind:</span>
                  <span>{typeof weatherWind === "number" ? `${weatherWind} m/s` : "--"}</span>
                </div>
                <div className="detail-item">
                  <span>Feels like:</span>
                  <span>{typeof weatherFeelsLike === "number" ? `${weatherFeelsLike}°C` : "--"}</span>
                </div>
              </div>
            </div>

            {alert && (
              <div className="weather-alert">
                <h3>Emergency Alert Active</h3>
                <p><strong>Source:</strong> {alert.source}</p>
                <p><strong>Event:</strong> {alert.event}</p>
                <p><strong>Summary:</strong> {alert.summary}</p>
                <p><strong>Orders:</strong> All active orders have been cancelled.</p>
                <p><strong>Claim amount:</strong> ₹{calculateClaimAmount(alert.event)}</p>
                <div className="safety-advice">
                  <h4>Safety Advice</h4>
                  <ul>
                    {alert.safetyAdvice.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="map-section">
          <h3>Live Map</h3>
          {mapUrl ? (
            <iframe
              title="Live Location Map"
              src={mapUrl}
              className="live-map"
              loading="lazy"
            />
          ) : (
            <p>Map will appear after location access is granted.</p>
          )}
        </div>

        <div className="orders-section">
          <h3>Order Operations</h3>
          <p>Active orders: {activeOrdersCount}</p>
          <p>Cancelled orders: {cancelledOrdersCount}</p>
          <button
            className="action-btn"
            onClick={restoreCancelledOrders}
            disabled={cancelledOrdersCount === 0}
          >
            Restore Cancelled Orders
          </button>
          <div className="claims-list">
            {orders.map((order) => (
              <div key={order.id} className="claim-item">
                <div className="claim-details">
                  <p><strong>Order:</strong> {order.id}</p>
                  <p><strong>Customer:</strong> {order.customer}</p>
                  <p><strong>Area:</strong> {order.area}</p>
                  <p><strong>Value:</strong> ₹{order.value}</p>
                  {order.cancellationReason && (
                    <p><strong>Reason:</strong> {order.cancellationReason}</p>
                  )}
                </div>
                <span className={`claim-status ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="auto-claims-history">
          <h3>Auto-Claims History</h3>
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
