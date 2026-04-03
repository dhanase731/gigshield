import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function InsuranceSetup() {
  const [amount, setAmount] = useState("");
  const recommendedPlans = [199, 299, 499];
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="card auth-shell insurance-shell">
        <div className="auth-aside">
          <div className="brand brand-left">
            <img src="/src/assets/gigshield-logo.svg" alt="GigShield Logo" className="logo" />
            <h2>Protection Checkout</h2>
          </div>
          <p className="auth-copy">Choose a weekly protection amount and activate weather-linked order safety instantly.</p>
          <ul className="feature-list">
            <li>Auto-alerts for risky weather zones</li>
            <li>Instant order pause and cancellation support</li>
            <li>Smart claims timeline with proof records</li>
          </ul>
        </div>

        <div className="auth-form-panel">
          <h3>Activate your weekly coverage</h3>
          <p className="form-subtext">Higher contribution unlocks higher claim protection for service downtime.</p>

          <div className="plan-chips">
            {recommendedPlans.map((plan) => (
              <button
                key={plan}
                type="button"
                className={`plan-chip ${String(plan) === String(amount) ? "selected" : ""}`}
                onClick={() => setAmount(String(plan))}
              >
                ₹{plan}/week
              </button>
            ))}
          </div>

          <input
            type="number"
            placeholder="Custom weekly amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <button
            onClick={async () => {
              if (!amount) {
                window.alert("Please select or enter a weekly amount.");
                return;
              }

              const userProfileRaw = localStorage.getItem("userProfile");
              const userProfile = userProfileRaw ? JSON.parse(userProfileRaw) : null;

              if (!userProfile?.uid) {
                window.alert("Please login again to continue.");
                navigate("/");
                return;
              }

              try {
                const { data } = await axios.put(`/api/users/${userProfile.uid}/insurance`, {
                  weeklyPay: Number(amount),
                });

                localStorage.setItem("weeklyPay", String(data.weeklyPay || Number(amount)));
                navigate("/dashboard");
              } catch {
                window.alert("Unable to save insurance plan. Please try again.");
              }
            }}
          >
            Activate Protection
          </button>
        </div>

      </div>
    </div>
  );
}

export default InsuranceSetup;