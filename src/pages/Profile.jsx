import { useMemo } from "react";

function Profile() {
  const userProfile = useMemo(() => {
    const profile = localStorage.getItem("userProfile");
    return profile ? JSON.parse(profile) : null;
  }, []);

  return (
    <div className="profile-container">
      <div className="card">
        <h2>User Profile</h2>
        {userProfile ? (
          <div className="profile-info">
            <div className="profile-field">
              <label>Name:</label>
              <p>{userProfile.name}</p>
            </div>
            <div className="profile-field">
              <label>Email:</label>
              <p>{userProfile.email}</p>
            </div>
            <div className="profile-field">
              <label>Phone:</label>
              <p>{userProfile.phone || "Not provided"}</p>
            </div>
            <div className="profile-field">
              <label>Location:</label>
              <p>{userProfile.location || "Not provided"}</p>
            </div>
            <div className="profile-field">
              <label>User ID:</label>
              <p className="user-id">{userProfile.uid || "N/A"}</p>
            </div>
            <button className="edit-profile-btn">Edit Profile</button>
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
      </div>
    </div>
  );
}

export default Profile;
