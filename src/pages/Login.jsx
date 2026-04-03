import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getRedirectResult, signInWithEmailAndPassword, signInWithRedirect } from "firebase/auth";
import { auth, provider } from "../firebase";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const syncProfileFromApi = useCallback(async (user) => {
    try {
      const { data } = await axios.get(`/api/users/${user.uid}/profile`);
      localStorage.setItem("userProfile", JSON.stringify(data));
      return data;
    } catch {
      const fallbackProfile = {
        name: user.displayName || "User",
        phone: "",
        location: "",
        email: user.email,
        uid: user.uid,
      };

      await axios.put(`/api/users/${user.uid}/profile`, fallbackProfile);
      localStorage.setItem("userProfile", JSON.stringify(fallbackProfile));
      return fallbackProfile;
    }
  }, []);

  const routeAfterAuth = useCallback(async (uid) => {
    try {
      const { data } = await axios.get(`/api/users/${uid}/insurance`);
      const weeklyPay = data?.weeklyPay || 0;

      if (weeklyPay > 0) {
        localStorage.setItem("weeklyPay", String(weeklyPay));
        navigate("/dashboard");
      } else {
        localStorage.removeItem("weeklyPay");
        navigate("/insurance");
      }
    } catch {
      localStorage.removeItem("weeklyPay");
      navigate("/insurance");
    }
  }, [navigate]);

  useEffect(() => {
    const processRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result?.user) {
          return;
        }

        await syncProfileFromApi(result.user);
        await routeAfterAuth(result.user.uid);
      } catch (err) {
        window.alert(err.message);
      }
    };

    processRedirectResult();
  }, [navigate, routeAfterAuth, syncProfileFromApi]);

  const handleLogin = async () => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await syncProfileFromApi(credential.user);
      await routeAfterAuth(credential.user.uid);
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