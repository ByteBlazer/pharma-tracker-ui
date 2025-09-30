import { createContext } from "react";
import { useLocalStorage } from "usehooks-ts";

export const GlobalContext = createContext({
  jwtToken: "",
  setJwtToken: (jwtToken: string) => {},
});

export const GlobalContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [jwtToken, setJwtToken] = useLocalStorage("jwtToken", "");

  return (
    <GlobalContext value={{ jwtToken, setJwtToken }}>{children}</GlobalContext>
  );
};
