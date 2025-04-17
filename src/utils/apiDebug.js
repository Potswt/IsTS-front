/**
 * Utility to test API response format
 * This can help identify issues with the login API
 */

import axios from "axios";
import { API_BASE_URL } from "./baseApi"; // Adjust the import path as necessary

export const testLoginAPI = async (employeeId, password) => {
  try {
    console.log("Testing login API with credentials:", {
      employeeId,
      password,
    });

    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      {
        employeeId,
        password,
      }
    );

    console.log("=== API Response Debug ===");
    console.log("Status:", response.status);
    console.log("Headers:", response.headers);
    console.log("Full response data:", response.data);

    // Check the response structure
    const data = response.data;

    console.log(
      "Success flag exists:",
      Object.prototype.hasOwnProperty.call(data, "success")
    );
    console.log("Success value:", data.success);

    if (data.user) {
      console.log("User object exists");
      console.log("User properties:", Object.keys(data.user));
      console.log("User role:", data.user.role);
    } else {
      console.log("User object is missing!");
    }

    if (data.token) {
      console.log("Token exists:", !!data.token);
      console.log("Token length:", data.token.length);
    } else {
      console.log("Token is missing!");
    }

    console.log("=== End API Response Debug ===");

    return response.data;
  } catch (error) {
    console.error("API Test Error:", error);
    if (error.response) {
      console.log("Error response:", error.response.data);
      console.log("Error status:", error.response.status);
    }
    throw error;
  }
};

// Helper to verify user data in localStorage
export const verifyUserData = () => {
  const userStr = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  console.log("=== User Data Verification ===");

  if (!userStr) {
    console.log("No user data found in localStorage");
    return null;
  }

  if (!token) {
    console.log("No token found in localStorage");
  } else {
    console.log("Token exists in localStorage");
  }

  try {
    const user = JSON.parse(userStr);
    console.log("User data parsed successfully");
    console.log("User data:", user);
    console.log("User role:", user.role);
    return user;
  } catch (error) {
    console.error("Failed to parse user data:", error);
    console.log("Raw user string:", userStr);
    return null;
  }
};
