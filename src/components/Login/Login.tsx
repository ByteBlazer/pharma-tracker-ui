import { useContext } from "react";
import { GlobalContext } from "../GlobalContextProvider";

function Login() {
  const { jwtToken, setJwtToken } = useContext(GlobalContext);
  return (
    <>
      <h1>JWT: {jwtToken}</h1>
      <h1>Login</h1>
      <button onClick={() => setJwtToken("1234567890")}>Login</button>
    </>
  );
}

export default Login;
