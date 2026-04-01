import { useState } from "react";
import { useNavigate } from "react-router-dom";

function InsuranceSetup() {
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="card">
        <div className="brand">
          <img src="/src/assets/gigshield-logo.svg" alt="GigShield Logo" className="logo" />
          <h2>Activate GigShield Insurance</h2>
        </div>

        <p>
          Choose your weekly contribution. Higher contribution = better coverage.
        </p>

        <input
          type="number"
          placeholder="Weekly amount (₹)"
          onChange={(e) => setAmount(e.target.value)}
        />

        <button
          onClick={() => {
            localStorage.setItem("weeklyPay", amount);
            navigate("/dashboard");
          }}
        >
          Activate Protection
        </button>

      </div>
    </div>
  );
}

export default InsuranceSetup;