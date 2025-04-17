import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  Button,
  message,
  Avatar,
  List,
  Typography,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import axios from "axios";
import { API_BASE_URL } from "../../utils/baseApi"

const { Option } = Select;
const { Title, Text } = Typography;

const AssignAdminModal = ({
  visible,
  onCancel,
  record,
  admins,
  loadingAdmins,
  onRefresh,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // ย้ายโค้ดที่ตั้งค่า form และ selectedAdmin มาอยู่ใน useEffect
  useEffect(() => {
    // จะทำงานเมื่อ visible, record หรือ admins เปลี่ยนแปลง
    if (visible && record && record.assignedAdmin) {
      // ตั้งค่าค่าเริ่มต้นถ้ามีการมอบหมายไว้แล้ว
      form.setFieldsValue({
        adminId: record.assignedAdmin.id || record.assignedAdmin._id,
      });

      // หา admin ที่ถูกเลือกในรายการ
      const admin = admins.find(
        (a) =>
          a._id === record.assignedAdmin.id ||
          a._id === record.assignedAdmin._id ||
          a.id === record.assignedAdmin.id
      );

      if (admin) {
        setSelectedAdmin(admin);
      }
    } else if (visible && !record?.assignedAdmin) {
      // รีเซ็ตฟอร์มเมื่อเปิด Modal และไม่มีผู้รับผิดชอบ
      form.resetFields();
      setSelectedAdmin(null);
    }
  }, [visible, record, admins, form]);

  const handleAdminChange = (adminId) => {
    const admin = admins.find((a) => a._id === adminId || a.id === adminId);
    setSelectedAdmin(admin);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();

      if (!record || !values.adminId) {
        message.error("ข้อมูลไม่ครบถ้วน");
        return;
      }

      setSubmitting(true);
      const token = localStorage.getItem("token");
      const issueId = record.issueId || record._id;

      console.log(`Assigning report ${issueId} to admin ${values.adminId}`);

      // เรียกใช้ API สำหรับมอบหมายงาน
      const response = await axios.put(
        `${API_BASE_URL}/reports/assign/${issueId}`,
        { adminId: values.adminId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Assignment response:", response.data);
      message.success("มอบหมายคำร้องสำเร็จ");

      // ปิด Modal และดึงข้อมูลใหม่
      onCancel();

      // อัพเดตข้อมูลหน้าหลัก
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error assigning admin:", error);
      if (error.response) {
        message.error(
          `ไม่สามารถมอบหมายงานได้: ${
            error.response.data?.message || "เกิดข้อผิดพลาด"
          }`
        );
      } else {
        message.error("ไม่สามารถมอบหมายงานได้");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="มอบหมายงาน"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          ยกเลิก
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
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
          มอบหมาย
        </Button>,
      ]}
      width={600}>
      {record && (
        <div>
          <div className="mb-4 pb-4 border-gray-300 border-b">
            <Title level={5}>รายละเอียดคำร้อง</Title>
            <Text strong>หัวข้อ:</Text> {record.topic}
            <br />
            <Text strong>ผู้แจ้ง:</Text> {record.employeeName || "ไม่ระบุชื่อ"}
            <br />
            <Text strong>สถานะ:</Text> {record.status || "รอดำเนินการ"}
            <br />
            <Text strong>วันที่:</Text>{" "}
            {record.date
              ? new Date(record.date).toLocaleDateString()
              : "ไม่ระบุ"}
          </div>

          <Form form={form} layout="vertical">
            <Form.Item
              name="adminId"
              label="เลือกผู้รับผิดชอบ"
              rules={[{ required: true, message: "กรุณาเลือกผู้รับผิดชอบ" }]}>
              <Select
                placeholder="เลือกผู้รับผิดชอบ"
                loading={loadingAdmins}
                onChange={handleAdminChange}
                style={{ width: "100%" }}>
                {admins.map((admin) => (
                  <Option
                    key={admin._id || admin.id}
                    value={admin._id || admin.id}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Avatar
                        size="small"
                        src={admin.profileImage}
                        icon={!admin.profileImage && <UserOutlined />}
                        style={{ marginRight: 8 }}
                      />
                      {admin.firstName} {admin.lastName} ({admin.role})
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>

          {selectedAdmin && (
            <div className="mt-4 pt-4 border-gray-300 border-t">
              <Title level={5}>ข้อมูลผู้รับผิดชอบ</Title>
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={selectedAdmin.profileImage}
                      icon={!selectedAdmin.profileImage && <UserOutlined />}
                      style={{
                        backgroundColor: !selectedAdmin.profileImage
                          ? "#1890ff"
                          : undefined,
                      }}
                      size={64}
                    />
                  }
                  title={`${selectedAdmin.firstName} ${selectedAdmin.lastName}`}
                  description={
                    <>
                      <div>
                        <Text type="secondary">ตำแหน่ง:</Text>{" "}
                        {selectedAdmin.role}
                      </div>
                      {selectedAdmin.email && (
                        <div>
                          <Text type="secondary">อีเมล:</Text>{" "}
                          {selectedAdmin.email}
                        </div>
                      )}
                      {selectedAdmin.department && (
                        <div>
                          <Text type="secondary">แผนก:</Text>{" "}
                          {selectedAdmin.department}
                        </div>
                      )}
                    </>
                  }
                />
              </List.Item>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

AssignAdminModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  record: PropTypes.object,
  admins: PropTypes.array.isRequired,
  loadingAdmins: PropTypes.bool,
  onRefresh: PropTypes.func,
};

export default AssignAdminModal;
