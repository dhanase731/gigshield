import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    location: "",
    email: "",
    password: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Signup attempt:", { email: form.email, name: form.name });

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      
      console.log("Firebase signup successful:", result.user);
      
      // Store user profile data
      localStorage.setItem("userProfile", JSON.stringify({
        name: form.name,
        phone: form.phone,
        location: form.location,
        email: form.email,
        uid: result.user.uid
      }));
      
      console.log("Profile saved to localStorage");
      alert("Account created successfully!");
      
      // New users always go to insurance
      navigate("/insurance");
    } catch (err) {
      console.error("Signup error:", err);
      alert("Signup failed: " + err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      
      console.log("Google signup successful:", result.user);
      
      // For Google signup, we'll get basic info from Google
      const user = result.user;
      localStorage.setItem("userProfile", JSON.stringify({
        name: user.displayName || "User",
        phone: "",
        location: "",
        email: user.email
      }));
      
      navigate("/insurance");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <div className="brand">
          <img src="/src/assets/gigshield-logo.svg" alt="GigShield Logo" className="logo" />
          <h2>Create Account - GigShield</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            required
          />

          <input
            type="tel"
            placeholder="Phone Number"
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
            required
          />

          <input
            type="text"
            placeholder="City/Location"
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
            required
          />

          <input
            type="email"
            placeholder="Email"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />

          <button type="submit">Sign Up</button>
        </form>

        <button onClick={handleGoogle} className="google-btn">
          Continue with Google
        </button>

        <p onClick={() => navigate("/")}>
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}

export default Signup;