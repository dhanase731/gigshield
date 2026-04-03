import { useEffect, useState } from "react";
import axios from "axios";

function Profile() {
  const [userProfile, setUserProfile] = useState(() => {
    const profile = localStorage.getItem("userProfile");
    return profile ? JSON.parse(profile) : null;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", location: "" });

  useEffect(() => {
    const loadProfile = async () => {
      if (!userProfile?.uid) {
        return;
      }

      try {
        const { data } = await axios.get(`/api/users/${userProfile.uid}/profile`);
        setUserProfile(data);
        setForm({
          name: data?.name || "",
          phone: data?.phone || "",
          location: data?.location || "",
        });
        localStorage.setItem("userProfile", JSON.stringify(data));
      } catch {
        // Keep local profile if API call fails
      }
    };

    loadProfile();
  }, [userProfile?.uid]);

  const saveProfile = async () => {
    if (!userProfile?.uid) {
      return;
    }

    try {
      const payload = {
        ...userProfile,
        name: form.name,
        phone: form.phone,
        location: form.location,
      };

      const { data } = await axios.put(`/api/users/${userProfile.uid}/profile`, payload);
      setUserProfile(data);
      localStorage.setItem("userProfile", JSON.stringify(data));
      setIsEditing(false);
    } catch {
      window.alert("Unable to update profile. Please try again.");
    }
  };

  return (
    <div className="profile-container">
      <div className="card">
        <h2>User Profile</h2>
        {userProfile ? (
          <div className="profile-info">
            <div className="profile-field">
              <label>Name:</label>
              {isEditing ? (
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              ) : (
                <p>{userProfile.name}</p>
              )}
            </div>
            <div className="profile-field">
              <label>Email:</label>
              <p>{userProfile.email}</p>
            </div>
            <div className="profile-field">
              <label>Phone:</label>
              {isEditing ? (
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              ) : (
                <p>{userProfile.phone || "Not provided"}</p>
              )}
            </div>
            <div className="profile-field">
              <label>Location:</label>
              {isEditing ? (
                <input
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                />
              ) : (
                <p>{userProfile.location || "Not provided"}</p>
              )}
            </div>
            <div className="profile-field">
              <label>User ID:</label>
              <p className="user-id">{userProfile.uid || "N/A"}</p>
            </div>
            {isEditing ? (
              <div className="insurance-actions">
                <button className="action-btn primary" onClick={saveProfile}>Save Profile</button>
                <button className="action-btn" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            ) : (
              <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
            )}
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
      </div>
    </div>
  );
}

export default Profile;
