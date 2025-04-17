import { Button, Checkbox, Input, Form, message } from "antd";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons"; // เพิ่มการ import ไอคอน
import axios from "axios";
import {
  logNavigationAttempt,
  diagnoseNavigationIssues,
} from "../utils/debugUtils";
import { useUser } from "../context/UserContext";
import { API_BASE_URL } from "../utils/baseApi"; // Import your API base URL from the utils file

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 24 },
  },
};

const LoginForm = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false); // State สำหรับการแสดงรหัสผ่าน
  const variant = Form.useWatch("variant", form);

  // ใช้ context เพื่ออัพเดตข้อมูลผู้ใช้
  const { updateUser } = useUser();

  // โหลดข้อมูลที่จัดเก็บไว้เมื่อเริ่มต้นคอมโพเนนต์
  useEffect(() => {
    // ตรวจสอบว่ามีข้อมูล remember me หรือไม่
    const savedEmployeeId = localStorage.getItem("rememberedEmployeeId");
    const rememberedMe = localStorage.getItem("rememberMe") === "true";

    if (savedEmployeeId && rememberedMe) {
      form.setFieldsValue({ employeeId: savedEmployeeId });
      setRememberMe(true);
    }
  }, [form]);

  // จัดการ checkbox remember me
  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  // สลับการแสดง/ซ่อนรหัสผ่าน
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleLogin = async (values) => {
    try {
      // ถ้าไม่มี values ที่ถูกส่งเข้ามา (กรณีเรียกฟังก์ชันจากปุ่ม) ให้ใช้ form.validateFields()
      if (!values) {
        values = await form.validateFields();
      }

      // จัดการ Remember Me
      if (rememberMe) {
        localStorage.setItem("rememberedEmployeeId", values.employeeId);
        localStorage.setItem("rememberMe", "true");
      } else {
        // ถ้าไม่ได้เลือก remember me ให้ลบข้อมูลออก
        localStorage.removeItem("rememberedEmployeeId");
        localStorage.removeItem("rememberMe");
      }

      // ตรวจสอบปัญหาการนำทางก่อนพยายามเข้าสู่ระบบ
      diagnoseNavigationIssues();

      setLoading(true);
      setError("");

      // เรียก API เพื่อเข้าสู่ระบบ
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        values
      );
      const data = response.data;
      // console.log("Raw login response:", data);

      if (data && data.success) {
        // ค้นหาข้อมูลผู้ใช้ในตำแหน่งที่เป็นไปได้
        const userData = data.user || data.userData || data.data || {};

        // console.log("User data extracted:", userData);

        // ตรวจสอบว่าเรามีข้อมูลผู้ใช้เพียงพอที่จะดำเนินการหรือไม่
        if (
          !userData ||
          (typeof userData === "object" && Object.keys(userData).length === 0)
        ) {
          console.warn("Login successful but user data is missing or empty");

          // สร้างข้อมูลผู้ใช้ขั้นต่ำหากจำเป็น
          const fallbackUserData = {
            employeeId: values.employeeId,
            name: data.name || values.employeeId || "User",
            role: data.role || "User",
          };

          // console.log("Using fallback user data:", fallbackUserData);

          // จัดเก็บข้อมูลที่มี
          localStorage.setItem("token", data.token || null);
          updateUser(fallbackUserData);

          message.success("Login successful!");

          // บันทึกการพยายามนำทางเพื่อการดีบัก
          logNavigationAttempt("/user/home", fallbackUserData);

          // เปลี่ยนเส้นทางไปยังหน้าแรกของผู้ใช้เป็นทางออก
          // console.log("Redirecting to user home (fallback)");
          window.location.href = "/user/home";
          return;
        }

        // หากเรามาถึงที่นี่ แสดงว่าเรามีข้อมูลผู้ใช้ - จัดเก็บข้อมูล
        localStorage.setItem("token", data.token || null);
        updateUser(userData);

        // กำหนดว่าจะเปลี่ยนเส้นทางไปที่ใดตามบทบาทผู้ใช้
        const role = userData.role;

        if (!role) {
          console.warn(
            "บทบาทผู้ใช้ไม่ได้กำหนด กำลังใช้บทบาท User เป็นค่าเริ่มต้น"
          );
          userData.role = "User"; // ตั้งค่าบทบาทเริ่มต้น
          updateUser(userData);
        }

        // บันทึกการพยายามนำทางเพื่อการดีบัก
        logNavigationAttempt(
          userData.role === "User" ? "/user/home" : "/",
          userData
        );

        // console.log("User role:", userData.role);

        // เปลี่ยนเส้นทางตามบทบาทพร้อมการตรวจสอบที่ปลอดภัย
        if (userData.role === "User") {
          // console.log("Redirecting to user home");
          window.location.href = "/user/home";
        } else if (
          userData.role === "Admin" ||
          userData.role === "SuperAdmin"
        ) {
          // console.log("Redirecting to admin dashboard");
          window.location.href = "/";
        } else {
          // console.log("Unknown role, redirecting to user home as fallback");
          window.location.href = "/user/home";
        }
      } else {
        setError(data?.message || "Login failed");
      }
    } catch (error) {
      console.error("Error during login:", error);

      if (error.name === "ValidationError") {
        setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      } else if (error.response) {
        console.error("Server error data:", error.response.data);
        console.error("Server error status:", error.response.status);
        setError(
          `Server error: ${
            error.response.data?.message || error.response.status
          }`
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        setError(
          "ไม่ได้รับการตอบกลับจากเซิร์ฟเวอร์ กรุณาตรวจสอบการเชื่อมต่อของคุณ"
        );
      } else {
        console.error("Error message:", error.message);
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับจัดการกด Enter บนฟอร์ม
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      form.submit();
    }
  };

  return (
    <Form
      className="w-80 max-w-md p-4"
      {...formItemLayout}
      form={form}
      variant={variant || "filled"}
      initialValues={{
        variant: "filled",
        remember: rememberMe,
      }}
      onFinish={handleLogin}
      onKeyDown={handleKeyDown}>
      <div className="text-2xl font-semibold mb-6 ">
        <span className="text-[#757575] text-sm font-normal">
          ยินดีต้อนรับ Issue Support and Tracking System!
        </span>

        <h1 className="text-[#333333] text-[22px] font-normal">
          ล็อกอินเข้าสู่ระบบ
        </h1>
      </div>

      {/* รหัสพนักงาน */}
      <div className="mb-4">
        <p className="mb-2">รหัสพนักงาน</p>
        <Form.Item
          name="employeeId"
          rules={[{ required: true, message: "กรุณากรอกรหัสพนักงาน" }]}>
          <Input
            type="text"
            placeholder="กรอกรหัสพนักงาน"
            size="large"
            autoComplete="username"
          />
        </Form.Item>
      </div>

      {/* รหัสผ่าน */}
      <div className="mb-4">
        <p className="mb-2">รหัสผ่าน</p>
        <Form.Item
          name="password"
          rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}>
          <Input
            type={passwordVisible ? "text" : "password"}
            placeholder="กรอกรหัสผ่าน"
            size="large"
            autoComplete="current-password"
            suffix={
              <span
                onClick={togglePasswordVisibility}
                style={{ cursor: "pointer" }}>
                {passwordVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </span>
            }
          />
        </Form.Item>
      </div>

      {/* Remember Me */}
      <div className="mb-4">
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox checked={rememberMe} onChange={handleRememberMeChange}>
            Remember Me
          </Checkbox>
        </Form.Item>
      </div>

      {/* Error Message */}
      {error && <div className="mb-4 text-red-500">{error}</div>}

      {/* ปุ่ม Login */}
      <div className="mb-4">
        <Button
          type="primary"
          htmlType="submit"
          style={{
            backgroundColor: "#262362",
            transition: "background-color 0.3s",
            border: "none",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#193CB8")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#262362")}
          size="large"
          block
          loading={loading}>
          เข้าสู่ระบบ
        </Button>
      </div>

      {/* ลิงก์ Create Account และ Forgot Password */}
      <div className="flex justify-between text-sm text-blue-500 mt-5">
        <Link to="/register">ลงทะเบียน</Link>
        <Link to="/forgot-password">ลืมรหัสผ่าน?</Link>
      </div>
    </Form>
  );
};

export default LoginForm;
