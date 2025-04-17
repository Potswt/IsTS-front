/**
 * ฟังก์ชันอ่านข้อมูลผู้ใช้จาก localStorage
 * @returns {Object|null} - ข้อมูลผู้ใช้หรือ null ถ้าไม่พบ
 */
export const getUserFromLocalStorage = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
};

/**
 * ฟังก์ชันบันทึกข้อมูลผู้ใช้ลงใน localStorage
 * @param {Object} userData - ข้อมูลผู้ใช้ที่ต้องการบันทึก
 */
export const saveUserToLocalStorage = (userData) => {
  if (!userData) return;
  try {
    localStorage.setItem("user", JSON.stringify(userData));
  } catch (error) {
    console.error("Error saving user to localStorage:", error);
  }
};

/**
 * Check if the user has the required role
 * @param {string} userRole - The current user's role
 * @param {string[]} allowedRoles - Array of roles that are allowed
 * @returns {boolean} - True if user has permission, false otherwise
 */
export const hasRequiredRole = (userRole, allowedRoles) => {
  if (!userRole || !allowedRoles || allowedRoles.length === 0) {
    return false;
  }

  return allowedRoles.includes(userRole);
};

/**
 * Get redirect path based on user role
 * @param {string} role - The user's role
 * @returns {string} - The appropriate redirect path
 */
export const getRedirectPath = (role) => {
  switch (role) {
    case "SuperAdmin":
    case "Admin":
      return "/";
    case "User":
      return "/user/home";
    default:
      return "/login";
  }
};
