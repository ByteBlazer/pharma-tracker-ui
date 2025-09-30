import { useContext } from "react";
import { GlobalContext } from "../GlobalContextProvider";

function Home() {
  const { loggedInUser, clearJwtToken } = useContext(GlobalContext);

  return (
    <>
      <h1>Home</h1>
      <p>Logged in user: {loggedInUser?.username}</p>
      <button onClick={() => clearJwtToken()}>Logout</button>
    </>
  );
}

export default Home;
