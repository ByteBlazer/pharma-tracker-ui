import { useJwt } from "../../hooks/useJwt";

function UserProfile() {
  const {
    decodedToken,
    getUserInfo,
    hasRole,
    getAllRoles,
    logout,
    isTokenValid,
  } = useJwt();

  if (!isTokenValid) {
    return <div>Please log in to view your profile.</div>;
  }

  const userInfo = getUserInfo();

  return (
    <div>
      <h1>User Profile</h1>

      {userInfo && (
        <div>
          <p>
            <strong>User ID:</strong> {userInfo.id}
          </p>
          <p>
            <strong>Username:</strong> {userInfo.username}
          </p>
          <p>
            <strong>Mobile:</strong> {userInfo.mobile}
          </p>
          <p>
            <strong>Roles:</strong> {userInfo.roles}
          </p>
          <p>
            <strong>Base Location:</strong> {userInfo.baseLocationName} (
            {userInfo.baseLocationId})
          </p>
          <p>
            <strong>Heartbeat Frequency:</strong>{" "}
            {userInfo.locationHeartBeatFrequencyInSeconds} seconds
          </p>
          {userInfo.issuedAt && (
            <p>
              <strong>Issued At:</strong> {userInfo.issuedAt.toLocaleString()}
            </p>
          )}
          {userInfo.expiresAt && (
            <p>
              <strong>Expires At:</strong> {userInfo.expiresAt.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {hasRole("admin") && (
        <div>
          <p>🔐 Admin privileges detected!</p>
        </div>
      )}

      <div>
        <h3>All User Roles:</h3>
        <ul>
          {getAllRoles().map((role, index) => (
            <li key={index}>{role}</li>
          ))}
        </ul>
      </div>

      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default UserProfile;
