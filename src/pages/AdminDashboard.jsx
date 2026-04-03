import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const emptyOrder = {
  orderId: "",
  zone: "",
  eta: "",
  value: "",
  risk: "Low",
};

const emptyClaim = {
  claimId: "",
  date: "",
  reason: "",
  amount: "",
  status: "Pending",
};

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [claims, setClaims] = useState([]);
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [claimForm, setClaimForm] = useState(emptyClaim);

  const userProfile = useMemo(() => {
    const profile = localStorage.getItem("userProfile");
    return profile ? JSON.parse(profile) : null;
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [summaryRes, ordersRes, claimsRes] = await Promise.all([
          axios.get(`/api/dashboard-summary${userProfile?.uid ? `?uid=${userProfile.uid}` : ""}`),
          axios.get(`/api/orders${userProfile?.uid ? `?uid=${userProfile.uid}` : ""}`),
          axios.get(`/api/claims${userProfile?.uid ? `?uid=${userProfile.uid}` : ""}`),
        ]);

        setOverview(summaryRes.data);
        setOrders(ordersRes.data || []);
        setClaims(claimsRes.data || []);
      } catch (error) {
        window.alert(error.message || "Failed to load admin data");
      }
    };

    loadData();
  }, [userProfile?.uid]);

  const saveOrder = async () => {
    const payload = {
      ...orderForm,
      value: Number(orderForm.value),
      userUid: userProfile?.uid || "",
    };

    const { data } = await axios.post("/api/orders", payload);
    setOrders((prev) => [data, ...prev]);
    setOrderForm(emptyOrder);
  };

  const saveClaim = async () => {
    const payload = {
      ...claimForm,
      amount: Number(claimForm.amount),
      userUid: userProfile?.uid || "",
    };

    const { data } = await axios.post("/api/claims", payload);
    setClaims((prev) => [data, ...prev]);
    setClaimForm(emptyClaim);
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>GigShield Admin</h2>
          <p className="user-name">MongoDB Console</p>
          <div className="sidebar-badge">Database Connected</div>
        </div>
      </aside>

      <main className="main-content">
        <div className="main-content-shell">
          <header className="content-header">
            <h1>Admin Dashboard</h1>
          </header>

          <div className="content-body">
            <div className="overview-container">
              <div className="card">
                <div className="kpi-row">
                  <div className="kpi-card">
                    <p className="kpi-label">Orders</p>
                    <h3>{overview?.protectedDrivers ?? orders.length}</h3>
                    <span>MongoDB collection: orders</span>
                  </div>
                  <div className="kpi-card">
                    <p className="kpi-label">Claims</p>
                    <h3>{overview?.openClaims ?? claims.length}</h3>
                    <span>MongoDB collection: claims</span>
                  </div>
                  <div className="kpi-card">
                    <p className="kpi-label">Weekly Pay</p>
                    <h3>₹{overview?.weeklyPay ?? 0}</h3>
                    <span>Synced from user profile</span>
                  </div>
                </div>

                <div className="ops-grid">
                  <section className="overview-card ops-panel">
                    <div className="panel-header">
                      <h3>Add / Update Order</h3>
                    </div>
                    <div className="form-grid">
                      {Object.keys(orderForm).map((key) => (
                        <input
                          key={key}
                          placeholder={key}
                          value={orderForm[key]}
                          onChange={(e) => setOrderForm((prev) => ({ ...prev, [key]: e.target.value }))}
                        />
                      ))}
                    </div>
                    <button className="action-btn primary" onClick={saveOrder}>Save Order</button>
                  </section>

                  <section className="overview-card ops-panel">
                    <div className="panel-header">
                      <h3>Add / Update Claim</h3>
                    </div>
                    <div className="form-grid">
                      {Object.keys(claimForm).map((key) => (
                        key === "status" ? (
                          <select
                            key={key}
                            value={claimForm[key]}
                            onChange={(e) => setClaimForm((prev) => ({ ...prev, [key]: e.target.value }))}
                          >
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Processing</option>
                            <option>Rejected</option>
                          </select>
                        ) : (
                          <input
                            key={key}
                            placeholder={key}
                            value={claimForm[key]}
                            onChange={(e) => setClaimForm((prev) => ({ ...prev, [key]: e.target.value }))}
                          />
                        )
                      ))}
                    </div>
                    <button className="action-btn primary" onClick={saveClaim}>Save Claim</button>
                  </section>
                </div>

                <div className="ops-grid">
                  <section className="overview-card ops-panel">
                    <div className="panel-header"><h3>Recent Orders</h3></div>
                    <div className="timeline">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.orderId} className="timeline-item">
                          <span className="timeline-dot live"></span>
                          <div>
                            <strong>{order.orderId}</strong>
                            <p>{order.zone} · {order.eta} · ₹{order.value} · {order.risk}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="overview-card ops-panel">
                    <div className="panel-header"><h3>Recent Claims</h3></div>
                    <div className="timeline">
                      {claims.slice(0, 5).map((claim) => (
                        <div key={claim.claimId} className="timeline-item">
                          <span className="timeline-dot done"></span>
                          <div>
                            <strong>{claim.claimId}</strong>
                            <p>{claim.reason} · {claim.date} · ₹{claim.amount} · {claim.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;