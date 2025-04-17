import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Form, Input, Button, message, Layout, Alert, Spin } from "antd";
import { KeyOutlined } from "@ant-design/icons";
import axios from "axios";
import {jwtDecode} from "jwt-decode"; // Correct import
import { API_BASE_URL } from "../utils/baseApi"; // Import your API base URL from the utils file

const { Content } = Layout;

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const ResetSetup = () => {
  const query = useQuery();
  const token = query.get("token");
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // เพิ่มสถานะสำหรับข้อความสำเร็จ
  const [email, setEmail] = useState("");

  // Verify token on component mount
  useEffect(() => {
    if (typeof token === "string" && token.trim() !== "") {
      try {
        const decodedToken = jwtDecode(token); // Use jwtDecode correctly
        setEmail(decodedToken.email);
        setTokenValid(true);
      } catch (err) {
        console.log("Error:", err);
        setError("Invalid token");
      }
    } else {
      setError("Invalid token");
    }
    setLoading(false);
  }, [token]);

  const resetPassword = async (values) => {
    if (values.newPassword !== values.confirmNewPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      setSuccessMessage(""); // ล้างข้อความสำเร็จ
      return;
    }

    if (!token || !values.newPassword || !values.confirmNewPassword) {
      setError("Token, password, and confirm password are required");
      setSuccessMessage(""); // ล้างข้อความสำเร็จ
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage(""); // ล้างข้อความสำเร็จก่อนเริ่มการส่งคำขอ
      
      // ส่งข้อมูลให้ครบถ้วนตามที่ API ต้องการ
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token: token,
        email: email,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword
      });
      
      // ตรวจสอบข้อความตอบกลับ
      if (response.data && response.data.message && response.data.message.includes("successfully")) {
        // ถ้าข้อความมีคำว่า "successfully" จะถือว่าสำเร็จ
        setSuccessMessage(response.data.message || "เปลี่ยนรหัสผ่านสำเร็จ!");
        message.success("เปลี่ยนรหัสผ่านสำเร็จ!");
        
        // เพิ่มการหน่วงเวลาก่อนนำทางไปยังหน้า login
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(response.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      
      // ตรวจสอบว่าข้อความใน error มีคำว่า "successfully" หรือไม่
      if (err.response?.data?.message && err.response.data.message.includes("successfully")) {
        setSuccessMessage(err.response.data.message);
        message.success("เปลี่ยนรหัสผ่านสำเร็จ!");
        
        // เพิ่มการหน่วงเวลาก่อนนำทางไปยังหน้า login
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(err.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout style={{ height: "100vh",width: "100vw"}}>
        <Content
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>กำลังตรวจสอบรหัสการรีเซ็ตรหัสผ่าน...</p>
        </Content>
      </Layout>
    );
  }

  return (
    <Content
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f2f5",
      }}>
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "30px",
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}>
        <h2 style={{ marginBottom: "24px", textAlign: "center" }}>
          รีเซ็ตรหัสผ่าน
        </h2>

        {error && (
          <Alert
            message="เกิดข้อผิดพลาด"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: "24px" }}
          />
        )}
        
        {/* เพิ่ม Alert สำหรับแสดงข้อความสำเร็จ */}
        {successMessage && (
          <Alert
            message="สำเร็จ"
            description={successMessage}
            type="success"
            showIcon
            style={{ marginBottom: "24px" }}
          />
        )}

        {tokenValid && !successMessage && (
          <>
            <p style={{ marginBottom: "24px" }}>
              กรุณาสร้างรหัสผ่านใหม่สำหรับบัญชีของคุณ
            </p>
            <Form form={form} layout="vertical" onFinish={resetPassword}>
              <Form.Item
                name="newPassword"
                label="รหัสผ่านใหม่"
                rules={[
                  { required: true, message: "กรุณาใส่รหัสผ่านใหม่" },
                  {
                    min: 6,
                    message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
                  },
                  {
                    pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/,
                    message: "รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข",
                  },
                ]}>
                <Input.Password
                  prefix={<KeyOutlined />}
                  placeholder="กรอกรหัสผ่านใหม่"
                />
              </Form.Item>
              <Form.Item
                name="confirmNewPassword"
                label="ยืนยันรหัสผ่าน"
                dependencies={["newPassword"]}
                rules={[
                  { required: true, message: "กรุณายืนยันรหัสผ่าน" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("รหัสผ่านทั้งสองไม่ตรงกัน!")
                      );
                    },
                  }),
                ]}>
                <Input.Password
                  prefix={<KeyOutlined />}
                  placeholder="ยืนยันรหัสผ่าน"
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    backgroundColor: "#262362",
                    transition: "background-color 0.3s",
                    border: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#193CB8")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "#262362")
                  }>
                    รีเซ็ตรหัสผ่าน
                  </Button>
                </Form.Item>
              </Form>
            </>
        )}

        {!tokenValid && !loading && !error && !successMessage && (
          <Alert
            message="ไม่พบโทเค็น"
            description="ไม่พบรหัสการรีเซ็ตรหัสผ่าน กรุณาขอลิงก์รีเซ็ตใหม่"
            type="warning"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => navigate("/forgot-password")}
                style={{
                  backgroundColor: "#262362",
                }}>
                ขอลิงก์ใหม่
              </Button>
            }
          />
        )}
      </div>
    </Content>
  );
};

export default ResetSetup;