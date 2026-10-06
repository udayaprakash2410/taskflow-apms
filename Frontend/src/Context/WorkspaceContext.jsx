/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const storageKey = "apms_session";
const tokenKey = "apms_token";

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(readSession);

  const login = async (email, password) => {
    try {
      const response = await fetch(
        "http://https://taskflow-apms.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Login failed",
        };
      }

      const session = data.user;

      localStorage.setItem(storageKey, JSON.stringify(session));

      localStorage.setItem(tokenKey, data.token);

      setCurrentUser(session);

      return {
        success: true,
        user: session,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        error:
          "Cannot connect to the server. Make sure the backend is running.",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(tokenKey);

    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role,
        isAuthenticated: Boolean(currentUser),
        token: localStorage.getItem(tokenKey),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export const useWorkspace = useAuth;
