import {
  Modal,
  Typography,
  Button,
  Space,
  Descriptions,
  Tag,
  Image,
  Avatar,
} from "antd";
import { UserOutlined, LinkOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import dayjs from "dayjs";

const { Title } = Typography;

const ReportDetailModal = ({ visible, onCancel, record, onAssign }) => {
  const getStatusText = (status) => {
    const statusMapping = {
      pending: "รอดำเนินการ",
      approved: "อนุมัติแล้ว",
      completed: "เสร็จสิ้น",
      rejected: "ถูกปฏิเสธ",
    };
    return statusMapping[status] || status;
  };

  // กำหนดสีของสถานะ
  const getStatusColor = (status) => {
    const statusColors = {
      pending: "orange",
      approved: "blue",
      completed: "green",
      rejected: "red",
    };
    return statusColors[status] || "default";
  };

  // ตรวจสอบประเภทของไฟล์แนบ
  const getFileType = (fileUrl) => {
    if (!fileUrl) return null;

    const extension = fileUrl.split(".").pop().toLowerCase();

    if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
      return "image";
    } else if (extension === "pdf") {
      return "pdf";
    } else if (["doc", "docx"].includes(extension)) {
      return "word";
    }

    return "other";
  };

  // แสดงข้อมูลไฟล์แนบ
  const renderAttachment = () => {
    if (!record || !record.file) return null;

    const fileType = getFileType(record.file);

    return (
      <div className="mt-4">
        <Title level={5}>ไฟล์แนบ</Title>
        {fileType === "image" ? (
          <div className="border rounded p-2">
            <Image
              src={record.file}
              alt="Attachment"
              style={{ maxWidth: "100%", maxHeight: "300px" }}
            />
          </div>
        ) : (
          <Button
            type="primary"
            icon={<LinkOutlined />}
            href={record.file}
            target="_blank"
            rel="noopener noreferrer">
            ดูไฟล์แนบ
          </Button>
        )}
      </div>
    );
  };

  if (!record) return null;

  return (
    <Modal
      title={<span>{record.topic}</span>}
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="assign" onClick={onAssign}>
          มอบหมายงาน
        </Button>,
        <Button key="close" onClick={onCancel}>
          ปิด
        </Button>,
      ]}>
      <div className="mb-4">
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="วันที่แจ้งปัญหา">
            {record.date ? dayjs(record.date).format("DD/MM/YYYY") : "ไม่ระบุ"}
          </Descriptions.Item>
          <Descriptions.Item label="พนักงานผู้แจ้ง">
            <Space>
              <Avatar
                src={record.profileImage}
                icon={!record.profileImage && <UserOutlined />}
              />
              {record.employeeName || "ไม่ระบุ"} (
              {record.department || "ไม่ระบุแผนก"})
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="รายละเอียด">
            {record.description || "ไม่มีรายละเอียด"}
          </Descriptions.Item>
          <Descriptions.Item label="สถานะ">
            <Tag color={getStatusColor(record.status)}>
              {getStatusText(record.status)}
            </Tag>
          </Descriptions.Item>
          {record.assignedAdmin && (
            <Descriptions.Item label="ผู้รับผิดชอบ">
              <Space>
                <Avatar
                  src={record.assignedAdmin.profileImage}
                  icon={!record.assignedAdmin.profileImage && <UserOutlined />}
                />
                {record.assignedAdmin.firstName} {record.assignedAdmin.lastName}
                ({record.assignedAdmin.role})
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
      {renderAttachment()}
    </Modal>
  );
};

ReportDetailModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  record: PropTypes.object,
  onAssign: PropTypes.func,
  onRefresh: PropTypes.func,
  API_BASE_URL: PropTypes.string.isRequired,
};

export default ReportDetailModal;
