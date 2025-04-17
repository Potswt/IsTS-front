/**
 * ดึงชื่อผู้ใช้จาก user object
 * @param {Object} user - ข้อมูลผู้ใช้
 * @returns {string} - ชื่อผู้ใช้ที่เหมาะสมสำหรับแสดงผล
 */
export const getUserDisplayName = (user) => {
  if (!user) return "ผู้ใช้งานระบบ";

  // เรียงลำดับความสำคัญของชื่อที่จะแสดง
  return user.displayName || // ชื่อที่แสดงจริง (ถ้ามี)
    user.fullName || // ชื่อเต็ม (ถ้ามี)
    (user.firstName && user.lastName)
    ? `${user.firstName} ${user.lastName}` // ชื่อ + นามสกุล (ถ้ามีทั้งสอง)
    : user.firstName || // ชื่อ (ถ้ามี)
        user.name || // ชื่อทั่วไป (ถ้ามี)
        user.username || // ชื่อผู้ใช้ (ถ้ามี)
        user.employeeId || // รหัสพนักงาน (ถ้ามี)
        "ผู้ใช้งานระบบ"; // ค่าเริ่มต้นถ้าไม่มีชื่อใดๆ
};

/**
 * ดึงตัวอักษรแรกของชื่อสำหรับใช้ใน Avatar
 * @param {Object} user - ข้อมูลผู้ใช้
 * @returns {string} - ตัวอักษรแรกของชื่อหรือเริ่มต้น
 */
export const getUserInitial = (user) => {
  if (!user) return "U";

  if (user.firstName) return user.firstName.charAt(0);
  if (user.name) return user.name.charAt(0);
  if (user.username) return user.username.charAt(0);
  if (user.displayName) return user.displayName.charAt(0);

  return "U";
};
