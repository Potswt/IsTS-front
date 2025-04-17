import { useState } from "react";
import { Form, Input, Button, Layout, Alert, Result } from "antd";
import { Link } from "react-router";
import axios from "axios";
import { API_BASE_URL } from "../utils/baseApi"; // Import your API base URL from the utils file

const { Content } = Layout;

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError(""); // ล้างข้อความ error เก่า

      const response = await axios.post(
        `${API_BASE_URL}/auth/forgot-password`,
        {
          email: values.email,
        }
      );

      console.log("Forgot password response:", response.data);

      // ตรวจสอบการตอบกลับจาก API ว่าสำเร็จหรือไม่
      if (
        response.data.success ||
        response.data.message === "Reset link sent to your email"
      ) {
        setSubmitted(true);
        // ต้องแน่ใจว่าไม่มีการแสดง error
        setError("");
      } else if (response.data.error) {
        // กรณีที่ API ส่ง error message มา
        setError(response.data.error || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
        setSubmitted(false);
      } else {
        setError("ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้ โปรดลองอีกครั้ง");
        setSubmitted(false);
      }
    } catch (error) {
      console.error("Error requesting password reset:", error);

      // กรณีมี error response จาก server
      if (error.response) {
        // หาก server ส่ง message ที่ระบุว่าส่งลิงก์รีเซ็ตแล้ว จะถือว่าสำเร็จ
        if (error.response.data?.message === "Reset link sent to your email") {
          setSubmitted(true);
          setError("");
        } else {
          // กรณี error จริงๆ
          setError(
            error.response?.data?.message ||
              error.response?.data?.error ||
              "ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้"
          );
          setSubmitted(false);
        }
      } else {
        // กรณีไม่สามารถเชื่อมต่อกับ server ได้
        setError(
          "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ โปรดลองอีกครั้งในภายหลัง"
        );
        setSubmitted(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Layout style={{ height: "100vh", width: "100vw" }}>
        <Content
          style={{
            margin: "0",
            padding: "0",
            height: "100vh", // ให้ Content ครอบคลุมทั้งความสูงของหน้าจอ
            width: "100vw", // ให้ Content ครอบคลุมทั้งความกว้างของหน้าจอ
            display: "flex",
            justifyContent: "center", // จัดให้อยู่กึ่งกลางแนวนอน
            alignItems: "center", // จัดให้อยู่กึ่งกลางแนวตั้ง
          }}>
          <div
            style={{
              width: "90%",
              maxWidth: "500px",
              padding: "30px",
              background: "#fff",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}>
            <Result
              status="success"
              title="ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว"
              subTitle={`กรุณาตรวจสอบอีเมลของคุณสำหรับลิงก์เพื่อรีเซ็ตรหัสผ่าน ลิงก์จะหมดอายุใน 30 นาที`}
              extra={[
                <Button
                  type="primary"
                  key="login"
                  onClick={() => (window.location.href = "/login")}
                  style={{
                    backgroundColor: "#262362",
                    transition: "background-color 0.3s",
                    border: "none",
                  }}>
                  กลับไปยังหน้าเข้าสู่ระบบ
                </Button>,
              ]}
            />
          </div>
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
          ลืมรหัสผ่าน
        </h2>

        <p style={{ marginBottom: "24px" }}>
          กรุณากรอกอีเมลที่คุณใช้ลงทะเบียน
          เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้คุณ
        </p>

        {error && (
          <Alert
            message="เกิดข้อผิดพลาด"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: "24px" }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <p className="mb-3">อีเมล</p>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "กรุณาใส่อีเมลของคุณ" },
              { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
            ]}>
            <Input size="large" placeholder="name@example.com" />
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
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#193CB8")}
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "#262362")
              }>
              ส่งลิงก์รีเซ็ตรหัสผ่าน
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Link to="/login">กลับไปยังหน้าเข้าสู่ระบบ</Link>
        </div>
      </div>
    </Content>
  );
};

export default ForgotPassword;
