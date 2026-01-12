import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuthenticated");
    const user = sessionStorage.getItem("currentUser");
    console.log("AuthContext: Checking sessionStorage on mount", { auth, user });
    if (auth === "true") {
      console.log("AuthContext: Restoring authentication");
      setIsAuthenticated(true);
      setCurrentUser(user);
    } else {
      console.log("AuthContext: No valid auth found");
    }
    setIsLoading(false);
  }, []);

  const login = (username) => {
    console.log("AuthContext: Login called with username:", username);
    sessionStorage.setItem("adminAuthenticated", "true");
    sessionStorage.setItem("currentUser", username);
    setIsAuthenticated(true);
    setCurrentUser(username);
    console.log("AuthContext: Login complete, sessionStorage:", {
      auth: sessionStorage.getItem("adminAuthenticated"),
      user: sessionStorage.getItem("currentUser")
    });
  };

  const logout = () => {
    sessionStorage.removeItem("adminAuthenticated");
    sessionStorage.removeItem("currentUser");
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
