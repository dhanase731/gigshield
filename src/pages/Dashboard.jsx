import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Profile from "./Profile";
import InsuranceManagement from "./InsuranceManagement";
import DrivingHours from "./DrivingHours";
import WeatherMonitor from "./WeatherMonitor";

function Dashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [serviceStatus, setServiceStatus] = useState("Checking...");
  const [lastSync, setLastSync] = useState("Checking...");
  const userProfile = useMemo(() => {
    const profile = localStorage.getItem("userProfile");
    return profile ? JSON.parse(profile) : null;
  }, []);
  const [weeklyPay, setWeeklyPay] = useState(localStorage.getItem("weeklyPay") || "0");

  const todayOrders = useMemo(
    () => [
      { id: "DEL-4812", zone: "Downtown", eta: "18 min", value: 240, risk: "Low" },
      { id: "DEL-4818", zone: "West Side", eta: "24 min", value: 320, risk: "Medium" },
      { id: "DEL-4821", zone: "Riverside", eta: "31 min", value: 180, risk: "High" },
    ],
    []
  );

  const claimsTimeline = useMemo(
    () => [
      { label: "Policy verified", time: "Today, 09:15", state: "done" },
      { label: "Weather sync complete", time: "Today, 10:05", state: "done" },
      { label: "Claim watch active", time: "Live", state: "live" },
    ],
    []
  );

  useEffect(() => {
    if (!userProfile) {
      navigate("/");
    }
  }, [navigate, userProfile]);

  useEffect(() => {
    let mounted = true;

    const checkServiceStatus = async () => {
      try {
        const [healthResponse, summaryResponse] = await Promise.all([
          axios.get("/api/health"),
          axios.get(`/api/dashboard-summary${userProfile?.uid ? `?uid=${userProfile.uid}` : ""}`),
        ]);

        const healthData = healthResponse.data;
        const summaryData = summaryResponse.data;
        if (!mounted) return;

        const reportedAt = new Date(healthData.timestamp || Date.now());
        setServiceStatus(healthData.status || "Operational");
        if (typeof summaryData.weeklyPay === "number") {
          setWeeklyPay(String(summaryData.weeklyPay));
          localStorage.setItem("weeklyPay", String(summaryData.weeklyPay));
        }
        setLastSync(reportedAt.toLocaleString());
      } catch {
        if (!mounted) return;
        setServiceStatus("API Offline");
        setLastSync("Unavailable");
      }
    };

    checkServiceStatus();

    return () => {
      mounted = false;
    };
  }, [userProfile?.uid]);

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
              <div className="overview-hero">
                <div>
                  <h2>Command Center</h2>
                  <p className="overview-subtitle">
                    Manage risk, orders, and safety operations from one place.
                  </p>
                </div>
                <div className="service-pill">
                  {serviceStatus}
                </div>
              </div>

              <div className="kpi-row">
                <div className="kpi-card">
                  <p className="kpi-label">Coverage Plan</p>
                  <h3>Active</h3>
                  <span>Weekly contribution: ₹{weeklyPay}</span>
                </div>
                <div className="kpi-card">
                  <p className="kpi-label">Orders in Queue</p>
                  <h3>{todayOrders.length}</h3>
                  <span>Live dispatch visibility enabled</span>
                </div>
                <div className="kpi-card">
                  <p className="kpi-label">Risk Engine</p>
                  <h3>Live</h3>
                  <span>Safety alerts enabled; order cancellation is user-controlled</span>
                </div>
                <div className="kpi-card">
                  <p className="kpi-label">Claims Readiness</p>
                  <h3>High</h3>
                  <span>Weather-linked claim automation active</span>
                </div>
              </div>

              <div className="ops-grid">
                <section className="overview-card ops-panel">
                  <div className="panel-header">
                    <h3>Today’s Delivery Operations</h3>
                    <button className="mini-btn" onClick={() => setActiveSection("weather")}>Open weather board</button>
                  </div>
                  <div className="orders-table">
                    {todayOrders.map((order) => (
                      <div className="order-row" key={order.id}>
                        <div>
                          <strong>{order.id}</strong>
                          <p>{order.zone}</p>
                        </div>
                        <div>
                          <strong>{order.eta}</strong>
                          <p>ETA</p>
                        </div>
                        <div>
                          <strong>₹{order.value}</strong>
                          <p>Value</p>
                        </div>
                        <span className={`risk-chip ${order.risk.toLowerCase()}`}>{order.risk} risk</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="overview-card ops-panel">
                  <div className="panel-header">
                    <h3>Protection Timeline</h3>
                    <button className="mini-btn" onClick={() => setActiveSection("insurance")}>Manage policy</button>
                  </div>
                  <div className="timeline">
                    {claimsTimeline.map((item) => (
                      <div key={item.label} className="timeline-item">
                        <span className={`timeline-dot ${item.state}`}></span>
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="quick-actions">
                <button className="action-btn" onClick={() => setActiveSection("hours")}>Track driving hours</button>
                <button className="action-btn" onClick={() => setActiveSection("profile")}>Update profile</button>
                <button className="action-btn" onClick={() => setActiveSection("weather")}>Run emergency drill</button>
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
          <div className="sidebar-badge">Insured & Monitoring</div>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li>
              <button 
                className={`nav-btn ${activeSection === "overview" ? "active" : ""}`}
                onClick={() => setActiveSection("overview")}
              >
                Overview
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeSection === "profile" ? "active" : ""}`}
                onClick={() => setActiveSection("profile")}
              >
                Profile
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeSection === "insurance" ? "active" : ""}`}
                onClick={() => setActiveSection("insurance")}
              >
                Insurance
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeSection === "hours" ? "active" : ""}`}
                onClick={() => setActiveSection("hours")}
              >
                Driving Hours
              </button>
            </li>
            <li>
              <button 
                className={`nav-btn ${activeSection === "weather" ? "active" : ""}`}
                onClick={() => setActiveSection("weather")}
              >
                Weather Monitor
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="main-content-shell">
          <header className="content-header">
            <h1>
              {activeSection === "overview" && "Dashboard Overview"}
              {activeSection === "profile" && "User Profile"}
              {activeSection === "insurance" && "Insurance Management"}
              {activeSection === "hours" && "Driving Hours"}
              {activeSection === "weather" && "Weather Monitor"}
            </h1>
            <div className="header-actions">
              <span className="last-sync">Last sync: {lastSync}</span>
            </div>
          </header>
          
          <div className="content-body">
            {renderActiveSection()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;