import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Avatar,
  message,
  Row,
  Col,
  Spin,
  Card,
  Divider,
  Upload,
} from "antd";
import {
  UploadOutlined,
  UserOutlined,
  LoadingOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../utils/baseApi"; // Import your API base URL from the utils file


// API Base URL

const AccountSettings = () => {
  const [form] = Form.useForm();
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); // เพิ่ม state สำหรับแสดงตัวอย่างรูปที่เลือก

  // เรียกใช้ context สำหรับข้อมูลผู้ใช้
  const { user, updateUser } = useUser();

  // ดึงข้อมูลผู้ใช้จากเซิร์ฟเวอร์
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        if (!user || !user.id) {
          message.error("ไม่พบข้อมูลผู้ใช้");
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");

        // เรียก API เพื่อดึงข้อมูลโปรไฟล์
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // รองรับทั้งกรณี response.data.user และ response.data
        const profileData = response.data.user || response.data.data;

        // อัพเดตข้อมูลผู้ใช้ใน context
        updateUser(profileData);

        // กำหนดค่าเริ่มต้นให้แบบฟอร์ม
        form.setFieldsValue({
          firstName: profileData.firstName || user.firstName || "",
          lastName: profileData.lastName || user.lastName || "",
          employeeId: profileData.employeeId || user.employeeId || "",
          department: profileData.department || user.department || "",
          position: profileData.position || user.position || "",
          phoneNumber: profileData.phoneNumber || user.phoneNumber || "",
          email: profileData.email || user.email || "",
        });

        // ตั้งค่ารูปโปรไฟล์
        const profileImageUrl =
          profileData.profileImage ||
          profileData.profilePicture ||
          user.profileImage ||
          user.profilePicture;

        setProfileImage(profileImageUrl);
        setPreviewImage(profileImageUrl); // เซ็ตรูปตัวอย่างเป็นรูปโปรไฟล์ปัจจุบันด้วย
      } catch (error) {
        console.error("Error fetching user profile:", error);
        message.error("ไม่สามารถดึงข้อมูลโปรไฟล์ได้");

        // ถ้าไม่สามารถเรียก API ได้ ใช้ข้อมูลจาก context แทน
        if (user) {
          form.setFieldsValue({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            employeeId: user.employeeId || "",
            department: user.department || "",
            position: user.position || "",
            phoneNumber: user.phoneNumber || "",
            email: user.email || "",
          });

          const userProfileImage = user.profileImage || user.profilePicture;
          setProfileImage(userProfileImage);
          setPreviewImage(userProfileImage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [form, updateUser, user]);

  // อัพโหลดรูปโปรไฟล์
  const handleUpload = async () => {
    if (!image) {
      message.warning("กรุณาเลือกรูปภาพก่อนอัพโหลด");
      return;
    }

    try {
      setUploadLoading(true);

      const userId = user.id || user._id;
      const token = localStorage.getItem("token");

      // สร้าง FormData สำหรับส่งไฟล์
      const formData = new FormData();
      formData.append("image", image);

      // ส่งไฟล์ไปยังเซิร์ฟเวอร์
      const response = await axios.put(
        `${API_BASE_URL}/users/profile/${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newres = response.data;

      // ตรวจสอบการตอบกลับ
      if (
        newres.data &&
        (newres.data.url ||
          newres.data.profileImage ||
          newres.data.profilePicture)
      ) {
        // ดึง URL รูปภาพจาก newres
        const imageUrl =
          newres.data.url ||
          newres.data.profileImage ||
          newres.data.profilePicture;

        // อัพเดต state และ context - ทำให้แน่ใจว่า update ทั้ง profileImage และ profilePicture
        setProfileImage(imageUrl);
        setPreviewImage(imageUrl); // อัพเดตรูปตัวอย่างด้วย
        updateUser({
          profileImage: imageUrl,
          profilePicture: imageUrl,
        });

        message.success("อัพโหลดรูปโปรไฟล์สำเร็จ");
      } else {
        // ถ้าไม่มีข้อมูลรูปจาก API แต่เรามี image แล้ว ให้สร้าง URL ท้องถิ่นและอัพเดต
        const localUrl = URL.createObjectURL(image);
        setProfileImage(localUrl);
        updateUser({
          profileImage: localUrl,
          profilePicture: localUrl,
        });

        message.success("อัพโหลดรูปโปรไฟล์สำเร็จ (local)");
      }

      // ล้าง image state เพื่อไม่ให้แสดงปุ่ม "อัพโหลดรูปภาพ" หลังจากอัพโหลดสำเร็จ
      setImage(null);
    } catch (error) {
      console.error("Error uploading profile image:", error);
      message.error("ไม่สามารถอัพโหลดรูปโปรไฟล์ได้");
    } finally {
      setUploadLoading(false);
    }
  };

  // ฟังก์ชันใหม่สำหรับจัดการการเลือกไฟล์
  const handleBeforeUpload = (file) => {
    // ตรวจสอบประเภทไฟล์
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("โปรดอัพโหลดไฟล์รูปภาพเท่านั้น!");
      return Upload.LIST_IGNORE;
    }

    // ตรวจสอบขนาดไฟล์ (ต้องไม่เกิน 2MB)
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("รูปภาพต้องมีขนาดไม่เกิน 2MB!");
      return Upload.LIST_IGNORE;
    }

    // สร้าง URL สำหรับแสดงตัวอย่างรูป
    const previewURL = URL.createObjectURL(file);
    setPreviewImage(previewURL);
    setImage(file);

    // return false เพื่อป้องกันการอัพโหลดอัตโนมัติของ antd
    return false;
  };

  // อัพเดตข้อมูลผู้ใช้
  const handleFinish = async (values) => {
    try {
      setSubmitting(true);

      if (!user || !user.id) {
        message.error("ไม่พบข้อมูลผู้ใช้");
        return;
      }

      const userId = user.id || user._id;
      const token = localStorage.getItem("token");

      // ส่งข้อมูลไปอัพเดตที่เซิร์ฟเวอร์
      const response = await axios.put(
        `${API_BASE_URL}/users/profile/${userId}`,
        {
          ...values,
          profileImage: profileImage,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const newres = response.data;

      if (newres.data) {
        message.success("อัพเดตข้อมูลโปรไฟล์สำเร็จ");

        // อัพเดตข้อมูลใหม่ใน context
        const fullName = `${values.firstName} ${values.lastName}`.trim();
        updateUser({
          ...values,
          name: fullName,
          profileImage: profileImage,
          profilePicture: profileImage,
        });
      } else {
        message.warning("ไม่สามารถอัพเดตข้อมูลบนเซิร์ฟเวอร์ได้");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("ไม่สามารถอัพเดตข้อมูลโปรไฟล์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <div style={{ marginTop: 16 }}>กำลังโหลดข้อมูลโปรไฟล์...</div>
      </div>
    );
  }

  return (
    <Card title="ข้อมูลส่วนตัว" className="shadow-md">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          firstName: "",
          lastName: "",
          employeeId: "",
          department: "",
          position: "",
          email: "",
          phoneNumber: "",
        }}>
        <div className="mb-6 text-center">
          {/* แสดงรูปตัวอย่าง */}
          <div className="mb-4">
            {previewImage ? (
              <Avatar size={100} src={previewImage} alt="Preview" />
            ) : (
              <Avatar size={100} icon={<UserOutlined />} />
            )}
          </div>

          {/* ส่วนเลือกรูปภาพ */}
          <div className="flex flex-col items-center space-y-4">
            <Upload
              name="profileImage"
              showUploadList={false}
              beforeUpload={handleBeforeUpload}>
              <Button icon={<UploadOutlined />} style={{ marginTop: 8 }}>
                เลือกรูปภาพ
              </Button>
            </Upload>

            {image && (
              <Button
                type="primary"
                onClick={handleUpload}
                loading={uploadLoading}
                style={{
                  backgroundColor: "#262362",
                  transition: "background-color 0.3s",
                  border: "none",
                  marginTop: 8,
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#193CB8")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#262362")
                }>
                อัพโหลดรูปภาพ
              </Button>
            )}

            {/* แสดงชื่อไฟล์ที่เลือก */}
            {image && (
              <div className="text-xs text-gray-500 mt-1">
                {image.name} ({(image.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        </div>

        <Divider />

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="firstName"
              label="ชื่อจริง"
              rules={[{ required: true, message: "กรุณากรอกชื่อจริง" }]}>
              <Input placeholder="กรอกชื่อจริง" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="lastName"
              label="นามสกุล"
              rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}>
              <Input placeholder="กรอกนามสกุล" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="employeeId" label="รหัสพนักงาน">
              <Input readOnly placeholder="รหัสพนักงาน" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="email" label="อีเมล">
              <Input readOnly placeholder="อีเมล" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="department" label="แผนก">
              <Input readOnly placeholder="แผนก" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="position" label="ตำแหน่ง">
              <Input readOnly placeholder="ตำแหน่ง" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="phoneNumber"
          label="เบอร์โทรศัพท์"
          rules={[
            { required: true, message: "กรุณากรอกเบอร์โทรศัพท์" },
            {
              pattern: /^[0-9]{9,10}$/,
              message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก",
            },
          ]}>
          <Input placeholder="กรอกเบอร์โทรศัพท์" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={submitting}
            style={{
              backgroundColor: "#262362",
              transition: "background-color 0.3s",
              border: "none",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#193CB8")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#262362")}>
            บันทึกข้อมูล
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AccountSettings;
