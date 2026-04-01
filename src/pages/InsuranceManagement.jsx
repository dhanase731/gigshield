import { useEffect, useState } from "react";

function InsuranceManagement() {
  const [weeklyContribution, setWeeklyContribution] = useState(0);
  const [totalClaims, setTotalClaims] = useState(0);
  const [claimHistory, setClaimHistory] = useState([]);

  useEffect(() => {
    const contribution = localStorage.getItem("weeklyPay");
    if (contribution) {
      setWeeklyContribution(parseFloat(contribution));
    }

    // Simulate claim history
    setClaimHistory([
      { id: 1, date: "2024-03-15", reason: "Heavy Rain", amount: 5000, status: "Approved" },
      { id: 2, date: "2024-02-28", reason: "Thunderstorm", amount: 3000, status: "Processing" }
    ]);
    setTotalClaims(2);
  }, []);

  return (
    <div className="insurance-container">
      <div className="card">
        <h2>🛡️ Insurance Management</h2>
        
        <div className="insurance-overview">
          <div className="overview-item">
            <h3>Weekly Contribution</h3>
            <p className="amount">₹{weeklyContribution}</p>
          </div>
          <div className="overview-item">
            <h3>Monthly Coverage</h3>
            <p className="amount">₹{weeklyContribution * 4}</p>
          </div>
          <div className="overview-item">
            <h3>Status</h3>
            <span className="status-active">Active</span>
          </div>
        </div>

        <div className="claim-history">
          <h3>Recent Claims</h3>
          {claimHistory.length > 0 ? (
            <div className="claims-list">
              {claimHistory.map(claim => (
                <div key={claim.id} className="claim-item">
                  <div className="claim-details">
                    <p><strong>Date:</strong> {claim.date}</p>
                    <p><strong>Reason:</strong> {claim.reason}</p>
                    <p><strong>Amount:</strong> ₹{claim.amount}</p>
                  </div>
                  <span className={`claim-status ${claim.status.toLowerCase()}`}>
                    {claim.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>No claims history</p>
          )}
        </div>

        <div className="insurance-actions">
          <button className="action-btn">Manage Plan</button>
          <button className="action-btn primary">File New Claim</button>
        </div>
      </div>
    </div>
  );
}

export default InsuranceManagement;
