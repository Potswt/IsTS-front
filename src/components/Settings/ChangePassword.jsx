import { Form, Input, Button, message, Modal } from "antd";
import axios from "axios";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { API_BASE_URL } from "../../utils/baseApi"; // Import your API base URL from the utils file

const { confirm } = Modal;

const ChangePassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const showConfirm = (values) => {
    confirm({
      title: "ยืนยันการเปลี่ยนรหัสผ่าน",
      icon: <ExclamationCircleFilled />,
      content:
        "หลังจากเปลี่ยนรหัสผ่าน คุณจะถูกนำไปยังหน้าเข้าสู่ระบบเพื่อล็อกอินใหม่อีกครั้ง",
      okText: "ยืนยัน",
      okType: "primary",
      cancelText: "ยกเลิก",
      okButtonProps: {
        style: {
          backgroundColor: "#262362",
          transition: "background-color 0.3s",
          border: "none",
        },
        onMouseEnter: (e) => (e.target.style.backgroundColor = "#193CB8"),
        onMouseLeave: (e) => (e.target.style.backgroundColor = "#262362"),
      },
      onOk() {
        handleChangePassword(values);
      },
    });
  };

  const handleChangePassword = async (values) => {
    try {
      // Call the API to change the password
      const response = await axios.post(
        `${API_BASE_URL}/auth/change-password`,
        {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          confirmNewPassword: values.confirmNewPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.message === "Password changed successfully") {
        message.success(
          "เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่"
        );
        form.resetFields();

        // ลบ token และ redirect ไปหน้า login
        localStorage.removeItem("token");

        // ให้เวลาผู้ใช้อ่านข้อความก่อนเปลี่ยนหน้า
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        message.error(response.data.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.response?.status === 401) {
        message.error("Unauthorized: Please log in again.");
      } else {
        message.error(
          error.response?.data?.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้"
        );
      }
    }
  };

  const handleFinish = (values) => {
    // แสดง confirm dialog ก่อนทำการเปลี่ยนรหัสผ่าน
    showConfirm(values);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item
        name="currentPassword"
        label="รหัสผ่านปัจจุบัน"
        rules={[{ required: true, message: "กรุณาใส่รหัสผ่านปัจจุบัน!" }]}>
        <Input.Password size={"large"} />
      </Form.Item>
      <Form.Item
        name="newPassword"
        label="รหัสผ่านใหม่"
        dependencies={["currentPassword"]} // เพิ่มการพึ่งพารหัสผ่านปัจจุบัน
        rules={[
          { required: true, message: "กรุณาใส่รหัสผ่านใหม่!" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("currentPassword") === value) {
                return Promise.reject(
                  new Error("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน!")
                );
              }
              return Promise.resolve();
            },
          }),
          // เพิ่มเงื่อนไขความซับซ้อนของรหัสผ่าน (ถ้าต้องการ)
          {
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
            message:
              "รหัสผ่านต้องมีอย่างน้อย 8 ตัว ประกอบด้วย ตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข",
          },
        ]}>
        <Input.Password size={"large"} />
      </Form.Item>
      <Form.Item
        name="confirmNewPassword"
        label="ยืนยันรหัสผ่าน"
        dependencies={["newPassword"]}
        rules={[
          { required: true, message: "กรุณายืนยันรหัสผ่านใหม่!" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("newPassword") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("รหัสผ่านไม่ตรงกัน!"));
            },
          }),
        ]}>
        <Input.Password size={"large"} />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          style={{
            backgroundColor: "#262362",
            transition: "background-color 0.3s",
            border: "none",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#193CB8")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#262362")}>
          เปลี่ยนรหัสผ่าน
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ChangePassword;
