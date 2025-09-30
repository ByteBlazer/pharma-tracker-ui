import { useJwt } from "../hooks/useJwt";

// Example component showing how to use the JWT functionality
function JwtUsageExample() {
  const {
    decodedToken,
    getUserInfo,
    hasRole,
    hasAnyRole,
    getAllRoles,
    isTokenValid,
    isTokenExpired,
  } = useJwt();

  if (!isTokenValid) {
    return <div>Please log in to continue.</div>;
  }

  const userInfo = getUserInfo();
  const userRoles = getAllRoles();

  return (
    <div>
      <h2>JWT Usage Examples</h2>

      {/* Basic user information */}
      <div>
        <h3>User Information</h3>
        <p>ID: {userInfo?.id}</p>
        <p>Username: {userInfo?.username}</p>
        <p>Mobile: {userInfo?.mobile}</p>
        <p>Base Location: {userInfo?.baseLocationName}</p>
        <p>
          Heartbeat Frequency: {userInfo?.locationHeartBeatFrequencyInSeconds}s
        </p>
      </div>

      {/* Role-based access control */}
      <div>
        <h3>Role-Based Access</h3>

        {hasRole("admin") && <p>🔐 Admin access granted</p>}

        {hasRole("manager") && <p>👔 Manager access granted</p>}

        {hasAnyRole(["admin", "supervisor"]) && (
          <p>🎯 High-level access granted</p>
        )}

        <p>All roles: {userRoles.join(", ")}</p>
      </div>

      {/* Token status */}
      <div>
        <h3>Token Status</h3>
        <p>Valid: {isTokenValid ? "✅" : "❌"}</p>
        <p>Expired: {isTokenExpired ? "⚠️" : "✅"}</p>
        {userInfo?.expiresAt && (
          <p>Expires: {userInfo.expiresAt.toLocaleString()}</p>
        )}
      </div>

      {/* Raw token data */}
      <div>
        <h3>Raw Token Data</h3>
        <pre>{JSON.stringify(decodedToken, null, 2)}</pre>
      </div>
    </div>
  );
}

export default JwtUsageExample;
