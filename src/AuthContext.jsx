import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuthenticated");
    const user = sessionStorage.getItem("currentUser");
    if (auth === "true") {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
    setIsLoading(false);
  }, []);

  const login = (username) => {
    sessionStorage.setItem("adminAuthenticated", "true");
    sessionStorage.setItem("currentUser", username);
    setIsAuthenticated(true);
    setCurrentUser(username);
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
