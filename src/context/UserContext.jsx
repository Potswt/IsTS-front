import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";

// สร้าง Context
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  // โหลดข้อมูลผู้ใช้จาก localStorage เมื่อ Provider ถูกโหลด
  useEffect(() => {
    const loadUserFromLocalStorage = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to load user from localStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromLocalStorage();
  }, []);

  // อัพเดตข้อมูลผู้ใช้และบันทึกลงใน localStorage - ใช้ useCallback และป้องกันการอัพเดตซ้ำซ้อน
  const updateUser = useCallback(
    (newUserData) => {
      try {
        // ตรวจสอบว่ามีการอัพเดตซ้ำซ้อนในช่วงเวลาสั้นๆ หรือไม่ (ภายใน 100ms)
        const now = Date.now();
        if (now - lastUpdateTime < 100) {
          console.log("Preventing rapid update, skipping...");
          return false;
        }

        // อัพเดต state แบบ functional เพื่อรับประกันว่าใช้ข้อมูลล่าสุดเสมอ
        setUser((prevUser) => {
          // ถ้าไม่มีข้อมูลใหม่ หรือข้อมูลเป็นโอบเจ็กต์ว่างเปล่า ไม่ต้องอัพเดต
          if (!newUserData || Object.keys(newUserData).length === 0) {
            return prevUser;
          }

          // ตรวจสอบว่ามีการเปลี่ยนแปลงข้อมูลจริงหรือไม่
          const hasChanges = Object.keys(newUserData).some((key) => {
            // เช็คเฉพาะฟิลด์ที่มีค่าไม่เป็น undefined และต่างจากค่าเดิม
            return (
              newUserData[key] !== undefined &&
              prevUser?.[key] !== newUserData[key]
            );
          });

          if (!hasChanges) {
            console.log("No actual data changes, skipping update");
            return prevUser;
          }

          // รวมข้อมูลรูปโปรไฟล์ให้ตรงกัน ไม่ว่าจะเรียกว่า profileImage หรือ profilePicture
          const mergedData = { ...prevUser, ...newUserData };

          // ทำให้ชื่อฟิลด์ profileImage และ profilePicture มีค่าเดียวกันเสมอ
          if (newUserData.profileImage) {
            mergedData.profilePicture = newUserData.profileImage;
          } else if (newUserData.profilePicture) {
            mergedData.profileImage = newUserData.profilePicture;
          }

          // บันทึกลง localStorage
          localStorage.setItem("user", JSON.stringify(mergedData));

          // บันทึกเวลาล่าสุดที่อัพเดต
          setLastUpdateTime(now);

          
          return mergedData;
        });

        return true;
      } catch (error) {
        console.error("Failed to update user:", error);
        return false;
      }
    },
    [lastUpdateTime]
  ); // เพิ่ม lastUpdateTime เป็น dependency

  const clearUser = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  // เพื่อป้องกันการสร้าง object ใหม่ทุกครั้งที่เรนเดอร์
  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      updateUser,
      clearUser,
    }),
    [user, isLoading, updateUser, clearUser]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom hook เพื่อใช้งาน UserContext ได้ง่ายขึ้น
export const useUser = () => useContext(UserContext);
