import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest, setToken, clearToken } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      if (!localStorage.getItem("music_token")) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest("/auth/me");
        setUser(data.user);
      } catch (error) {
        // Chỉ xóa token khi API trả về 401.
        // Lỗi 500 hoặc mất kết nối không được tự động đăng xuất.
        if (!localStorage.getItem("music_token")) {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function login(email, password) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(form) {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: form,
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function updateUser(data) {
    const result = await apiRequest("/users/me", {
      method: "PATCH",
      body: data,
    });
    setUser(result.user);
    return result.user;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
