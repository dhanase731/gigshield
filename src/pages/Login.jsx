import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRedirectResult, signInWithEmailAndPassword, signInWithRedirect } from "firebase/auth";
import { auth, provider } from "../firebase";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const processRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result?.user) {
          return;
        }

        const existingProfile = localStorage.getItem("userProfile");
        if (!existingProfile) {
          localStorage.setItem("userProfile", JSON.stringify({
            name: result.user.displayName || "User",
            phone: "",
            location: "",
            email: result.user.email,
            uid: result.user.uid
          }));
        }

        const weeklyPay = localStorage.getItem("weeklyPay");
        if (weeklyPay) {
          navigate("/dashboard");
        } else {
          navigate("/insurance");
        }
      } catch (err) {
        window.alert(err.message);
      }
    };

    processRedirectResult();
  }, [navigate]);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user has completed insurance setup
      const weeklyPay = localStorage.getItem("weeklyPay");
      if (weeklyPay) {
        navigate("/dashboard");
      } else {
        navigate("/insurance");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithRedirect(auth, provider);
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-shell">
        <div className="auth-aside">
          <div className="brand brand-left">
            <img src="/src/assets/gigshield-logo.svg" alt="GigShield Logo" className="logo" />
            <h2>GigShield Access</h2>
          </div>
          <p className="auth-copy">Insurance-grade protection for everyday delivery operations.</p>
          <ul className="feature-list">
            <li>Instant risk alerts for severe weather</li>
            <li>Auto-claims workflow for downtime events</li>
            <li>Order safety controls from one dashboard</li>
          </ul>
        </div>

        <div className="auth-form-panel">
          <h3>Sign in to continue</h3>
          <p className="form-subtext">Track deliveries, monitor risk, and keep every shift protected.</p>

          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleLogin}>Login</button>

          <button onClick={handleGoogle} className="google-btn">
            Continue with Google
          </button>

          <p onClick={() => navigate("/signup")}>
            Don't have an account? Sign Up
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;