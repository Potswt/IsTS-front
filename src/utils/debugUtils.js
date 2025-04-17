/**
 * Debug utility to help troubleshoot routing issues
 * Logs user information and routing attempts
 */
export const logNavigationAttempt = (destination, userData) => {
  console.log("=== Navigation Debug Info ===");
  console.log(`Attempting to navigate to: ${destination}`);
  console.log("Current user data:", userData);

  // Check for valid user data in localStorage
  const storedUserStr = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");

  console.log("Token exists:", !!storedToken);

  if (storedUserStr) {
    try {
      const storedUser = JSON.parse(storedUserStr);
      console.log("User from localStorage:", storedUser);
      console.log("Role from localStorage:", storedUser.role);
    } catch (error) {
      console.error("Failed to parse stored user data:", error);
      console.log("Raw stored user string:", storedUserStr);
    }
  } else {
    console.log("No user data found in localStorage");
  }

  console.log("=== End Navigation Debug Info ===");
};

/**
 * Check for common issues that might prevent proper navigation
 */
export const diagnoseNavigationIssues = () => {
  console.log("=== Navigation Diagnosis ===");

  // Check if router is properly initialized
  if (!window.history || typeof window.history.pushState !== "function") {
    console.error("History API not available - router might not be working");
  } else {
    console.log("History API available - router should work");
  }

  // Check for local storage issues
  try {
    localStorage.setItem("test", "test");
    const testValue = localStorage.getItem("test");
    if (testValue === "test") {
      console.log("LocalStorage working properly");
      localStorage.removeItem("test");
    } else {
      console.error("LocalStorage not working correctly");
    }
  } catch (e) {
    console.error("LocalStorage error:", e);
  }

  console.log("=== End Navigation Diagnosis ===");
};
