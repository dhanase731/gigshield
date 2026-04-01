import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
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
      const result = await signInWithPopup(auth, provider);
      
      // Store user profile from Google if not exists
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

  return (
    <div className="auth-container">
      <div className="card">
        <div className="brand">
          <img src="/src/assets/gigshield-logo.svg" alt="GigShield Logo" className="logo" />
          <h2>Welcome to GigShield</h2>
        </div>

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
  );
}

export default Login;