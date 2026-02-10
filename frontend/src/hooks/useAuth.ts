import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface User {
  id: string;
  email: string;
  fullName: string;
}

export function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/auth/verify`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem("authToken");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/auth/login`,
      {
        email,
        password,
      },
    );

    localStorage.setItem("authToken", response.data.token);
    setUser(response.data.user);
    setIsAuthenticated(true);
    return response.data;
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
  ) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/auth/register`,
      {
        email,
        password,
        fullName,
      },
    );

    localStorage.setItem("authToken", response.data.token);
    setUser(response.data.user);
    setIsAuthenticated(true);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setIsAuthenticated(false);
    navigate("/", { replace: true });
  };

  return { user, loading, isAuthenticated, login, register, logout };
}
