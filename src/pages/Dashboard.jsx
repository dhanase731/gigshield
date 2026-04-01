import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Profile from "./Profile";
import InsuranceManagement from "./InsuranceManagement";
import DrivingHours from "./DrivingHours";
import WeatherMonitor from "./WeatherMonitor";

function Dashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const profile = localStorage.getItem("userProfile");
    if (profile) {
      setUserProfile(JSON.parse(profile));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userProfile");
    localStorage.removeItem("weeklyPay");
    navigate("/");
  };

  const renderActiveSection = () => {
    switch(activeSection) {
      case "profile":
        return <Profile />;
      case "insurance":
        return <InsuranceManagement />;
      case "hours":
        return <DrivingHours />;
      case "weather":
        return <WeatherMonitor />;
      default:
        return (
          <div className="overview-container">
            <div className="card">
              <h2>📊 Dashboard Overview</h2>
              <div className="overview-grid">
                <div className="overview-card">
                  <h3>Welcome back!</h3>
                  <p>{userProfile?.name || "User"}</p>
                  <p>Select an option from the left panel to manage your GigShield account.</p>
                </div>
                <div className="overview-card">
                  <h3>🛡️ Insurance Status</h3>
                  <p>Active</p>
                  <p>Weekly: ₹{localStorage.getItem("weeklyPay") || "0"}</p>
                </div>
                <div className="overview-card">
                  <h3>🌤️ Weather</h3>
                  <p>Monitoring active</p>
                  <p>Auto-claims enabled</p>
                </div>
                <div className="overview-card">
                  <h3>🚗 Today's Progress</h3>
                  <p>Driving hours tracked</p>
                  <p>Goals being met</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Left Panel Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/src/assets/gigshield-logo.svg" alt="GigShield Logo" className="sidebar-logo" />
            <h2>GigShield</h2>
          </div>
          <p className="user-name">{userProfile?.name || "User"}</p>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li>
              <button 
                className={`nav-btn ${activeSection === "overview" ? "active" : ""}`}
                onClick={() => setActiveSection("overview")}
              >
                📊 Overview
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeSection === "profile" ? "active" : ""}`}
                onClick={() => setActiveSection("profile")}
              >
                👤 Profile
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeSection === "insurance" ? "active" : ""}`}
                onClick={() => setActiveSection("insurance")}
              >
                🛡️ Insurance
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeSection === "hours" ? "active" : ""}`}
                onClick={() => setActiveSection("hours")}
              >
                🚗 Driving Hours
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeSection === "weather" ? "active" : ""}`}
                onClick={() => setActiveSection("weather")}
              >
                🌤️ Weather Monitor
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="content-header">
          <h1>
            {activeSection === "overview" && "Dashboard Overview"}
            {activeSection === "profile" && "User Profile"}
            {activeSection === "insurance" && "Insurance Management"}
            {activeSection === "hours" && "Driving Hours"}
            {activeSection === "weather" && "Weather Monitor"}
          </h1>
          <div className="header-actions">
            <span className="last-sync">Last sync: Just now</span>
          </div>
        </header>
        
        <div className="content-body">
          {renderActiveSection()}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;