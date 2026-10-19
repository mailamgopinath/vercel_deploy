// Remembers who is logged in, and shares it with every page.
// Any component can do:  const { user, login, logout } = useAuth();

import React, { createContext, useContext, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

// When the page reloads, restore the user saved in the browser.
function readSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("stylehub-user"));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser);

  // Save the token + user after a successful login/register.
  function saveLogin(data) {
    localStorage.setItem("stylehub-token", data.token);
    localStorage.setItem("stylehub-user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    saveLogin(response.data);
    return response.data.user;
  }

  async function register(name, email, password) {
    const response = await api.post("/auth/register", { name, email, password });
    saveLogin(response.data);
    return response.data.user;
  }

  function logout() {
    localStorage.removeItem("stylehub-token");
    localStorage.removeItem("stylehub-user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
