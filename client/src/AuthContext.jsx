// Remembers who is logged in, and shares it with every page.
// Any component can do:  const { user, login, logout } = useAuth();

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

// The login token itself is an HttpOnly cookie that the browser keeps and JavaScript cannot
// read. Only the user's name/role (not secret) is saved here, to show the header quickly.
function readSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("stylehub-user"));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser);

  // On page load, ask the server if the cookie is still valid. If not, log out here too.
  useEffect(() => {
    if (!readSavedUser()) return;
    api.get("/auth/me")
      .then((response) => {
        localStorage.setItem("stylehub-user", JSON.stringify(response.data.user));
        setUser(response.data.user);
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("stylehub-user");
          setUser(null);
        }
      });
  }, []);

  // Remember the user after a successful login/register (the server set the cookie).
  function saveLogin(data) {
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
    api.post("/auth/logout").catch(() => {}); // the server deletes the cookie
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
