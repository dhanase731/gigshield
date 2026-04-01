import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const userProfile = localStorage.getItem("userProfile");
      const weeklyPay = localStorage.getItem("weeklyPay");
      
      if (!userProfile) {
        navigate("/");
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
