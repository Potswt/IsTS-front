import {
  Card,
  Dropdown,
  Button,
  Tag,
  Avatar,
  Typography,
  Tooltip,
  Modal,
  Rate,
  message,
} from "antd";
import {
  MoreOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileOutlined,
  FileWordOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StarOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/baseApi"; // Import your API base URL from the utils file

const { Text, Paragraph } = Typography;

// กำหนดสีของสถานะ
const statusColors = {
  รอดำเนินการ: "orange",
  เสร็จสิ้น: "green",
  ถูกปฏิเสธ: "red",
  อนุมัติแล้ว: "blue",
  pending: "orange",
  completed: "green",
  rejected: "red",
  approved: "blue",
};

const IssueCard = ({
  issue,
  onEdit,
  onDelete,
  readOnly = false,
  onRatingChange,
}) => {
  // ดึงข้อมูลผู้ใช้จาก UserContext
  const { user } = useUser();
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [rating, setRating] = useState(issue.rating || null);
  const [displayRating, setDisplayRating] = useState(issue.rating || null);
  const [submitting, setSubmitting] = useState(false);

  // สร้างเมนูสำหรับตัวเลือกบนการ์ด - ปรับให้รองรับโหมด readOnly
  const getMenu = () => {
    const menuItems = [];

    // แสดงตัวเลือกแก้ไขเฉพาะเมื่อไม่ใช่โหมด readOnly และมี onEdit
    if (!readOnly && onEdit) {
      menuItems.push({
        key: "edit",
        label: "แก้ไขคำร้อง",
        onClick: () => onEdit(issue),
      });
    }

    // สำหรับคำร้องที่เสร็จสิ้นเท่านั้น ให้แสดงตัวเลือกให้คะแนน (ไม่รวมถูกปฏิเสธ)
    // เฉพาะเมื่อยังไม่เคยมีการให้คะแนนมาก่อน (rating เป็น 0 หรือ null)
    if (
      (issue.status === "completed" || issue.status === "เสร็จสิ้น") &&
      readOnly &&
      (!issue.rating || issue.rating === null) // เพิ่มเงื่อนไขตรวจสอบว่ายังไม่เคยให้คะแนน
    ) {
      menuItems.push({
        key: "rate",
        label: "ให้คะแนน",
        icon: <StarOutlined />,
        onClick: () => setRatingModalVisible(true),
      });
    }

    // แสดงตัวเลือกลบเสมอถ้ามี onDelete แม้จะเป็น readOnly
    if (onDelete) {
      menuItems.push({
        key: "delete",
        label: "ลบคำร้อง",
        danger: true,
        onClick: () => onDelete(issue),
      });
    }

    return menuItems;
  };

  // ปรับจากไอคอน EyeOutlined เป็น MoreOutlined เสมอ เพื่อให้สื่อว่ามีเมนู
  const menuIcon = <MoreOutlined />;

  // ดึงข้อมูลและตั้งค่าตัวแปรเริ่มต้น (กรณีรูปแบบข้อมูลต่างกัน) - แก้ไขให้ตรงกับ API
  const title = issue.topic || issue.title || issue.issue || "ไม่มีหัวข้อ";
  const description = issue.description || "";
  const date = issue.date || issue.createdAt || issue.updatedAt;
  const status = issue.status || "รอดำเนินการ";
  // เพิ่มการดึงข้อมูล comment ที่อาจเป็นเหตุผลการปฏิเสธ
  const rejectReason = issue.comment || null;

  // ข้อมูลผู้ใช้จะเก็บแยกอยู่แล้ว ไม่มีในคำร้อง
  const employeeName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.name || "ผู้ใช้งาน";
  const profileImage = user?.profileImage || user?.profilePicture;

  // ข้อมูลผู้รับผิดชอบ (Admin/SuperAdmin)
  const assignedAdmin = issue.assignedAdmin || null;
  const hasAssignedAdmin =
    assignedAdmin !== null && typeof assignedAdmin === "object";

  // สำหรับไฟล์แนบ
  const fileUrl = issue.file || ""; // backend เก็บเป็น file (ไม่ใช่ files array)
  const fileName = fileUrl ? fileUrl.split("/").pop() : "";

  // แปลงสถานะภาษาอังกฤษเป็นภาษาไทย
  const statusMapping = {
    pending: "รอดำเนินการ",
    completed: "เสร็จสิ้น",
    rejected: "ถูกปฏิเสธ",
    approved: "อนุมัติแล้ว",
  };

  const displayStatus = statusMapping[status] || status;
  const statusColor = statusColors[status] || "default";

  const formattedDate = dayjs(date).format("DD/MM/YYYY ");

  // ตรวจสอบประเภทไฟล์แนบ
  const getFileTypeFromUrl = (url) => {
    if (!url) return null;
    const extension = url.split(".").pop().toLowerCase();

    if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
      return "image";
    } else if (extension === "pdf") {
      return "pdf";
    } else if (["doc", "docx"].includes(extension)) {
      return "word";
    }
    return "other";
  };

  const fileType = getFileTypeFromUrl(fileUrl);

  useEffect(() => {
    if (issue?.rating) {
      setDisplayRating(issue.rating);
      setRating(issue.rating);
    }
    // console.log("Rating changed:", {
    //   issueRating: issue.rating,
    //   displayRating,
    // });
  }, [issue.rating, displayRating]);

  // ฟังก์ชันบันทึกคะแนน
  const handleRatingSubmit = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const issueId = issue._id || issue.issueId || issue.id;

      // ส่ง API request เพื่อบันทึกคะแนน
      await axios.put(
        `${API_BASE_URL}/reports/rate/${issueId}`,
        { rating },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      message.success("บันทึกคะแนนสำเร็จ");
      setRatingModalVisible(false);

      // อัปเดตค่า rating ใน state
      setDisplayRating(rating);

      // อัปเดตค่า rating ใน issue ด้วย (ถ้ามีการส่ง callback จาก parent)
      issue.rating = rating;

      // แจ้ง parent component เพื่ออัปเดตข้อมูลหลัก (ถ้ามี)
      if (typeof onRatingChange === "function") {
        onRatingChange(issueId, rating);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      message.error("ไม่สามารถบันทึกคะแนนได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card
        title={
          <Tooltip title={title}>
            <div className="text-lg font-medium truncate max-w-full">
              {title}
            </div>
          </Tooltip>
        }
        extra={
          <Dropdown menu={{ items: getMenu() }} trigger={["click"]}>
            <Button type="text" icon={menuIcon} />
          </Dropdown>
        }
        className={`w-full h-full shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
          readOnly ? "bg-gray-50" : ""
        }`}>
        {/* ข้อมูลผู้แจ้ง */}
        <div className="flex flex-wrap items-center mb-4 gap-2">
          <Avatar
            src={profileImage}
            size={window.innerWidth < 768 ? "default" : "large"}
            className="mr-2"
          />
          <div className="min-w-0 flex-grow">
            <Text
              strong
              className="text-sm block truncate"
              title={employeeName}>
              {employeeName}
            </Text>
            <Text
              type="secondary"
              className="text-xs block truncate"
              title={user?.department || "ไม่ระบุแผนก"}>
              {user?.department || "ไม่ระบุแผนก"}
            </Text>
          </div>
          <Tooltip title={formattedDate}>
            <div className="flex items-center text-xs text-gray-400 ml-auto">
              <ClockCircleOutlined className="mr-1" />
              {dayjs(date).format("DD/MM/YYYY")}
            </div>
          </Tooltip>
        </div>

        {/* คำอธิบาย */}
        <div className="mb-4">
          <Paragraph
            ellipsis={{
              rows: window.innerWidth < 768 ? 2 : 3,
              expandable: true,
              symbol: "อ่านเพิ่มเติม",
            }}
            className="whitespace-pre-line text-sm">
            {description}
          </Paragraph>
        </div>

        {/* แถวด้านล่าง - แสดงสถานะ (ซ้าย) และผู้รับผิดชอบ (ขวา) */}
        <div className="flex justify-between items-center flex-wrap gap-2">
          {/* สถานะด้านซ้าย */}
          <Tag color={statusColor} className="px-2 py-1">
            {displayStatus}
          </Tag>

          {/* แสดงคะแนนดาวเฉพาะในโหมด readOnly (tab ประวัติ) และมีคะแนน และเฉพาะคำร้องที่มีสถานะเสร็จสิ้น */}
          {readOnly &&
            displayRating > 0 &&
            (issue.status === "completed" || issue.status === "เสร็จสิ้น") && (
              <div className="flex items-center ml-2">
                <Rate
                  disabled
                  value={displayRating}
                  allowHalf
                  style={{
                    fontSize: window.innerWidth < 768 ? "12px" : "14px",
                  }}
                />
                <span className="ml-1 text-xs text-gray-500">
                  ({displayRating})
                </span>
              </div>
            )}

          {/* ผู้รับผิดชอบด้านขวา */}
          {hasAssignedAdmin && (
            <Tooltip
              title={`ผู้รับผิดชอบ: ${
                assignedAdmin.firstName && assignedAdmin.lastName
                  ? `${assignedAdmin.firstName} ${assignedAdmin.lastName}`
                  : assignedAdmin.name || "ผู้ดูแลระบบ"
              }`}
              placement="bottom">
              <div className="flex items-center">
                <Text className="text-xs text-gray-500 mr-1 hidden xs:inline">
                  ผู้รับผิดชอบ:
                </Text>
                <Avatar
                  src={
                    assignedAdmin.profileImage || assignedAdmin.profilePicture
                  }
                  icon={
                    !(
                      assignedAdmin.profileImage || assignedAdmin.profilePicture
                    ) && <UserOutlined />
                  }
                  size="small"
                />
                <Text strong className="text-xs ml-1 hidden sm:inline">
                  {assignedAdmin.firstName && assignedAdmin.lastName
                    ? `${assignedAdmin.firstName} ${assignedAdmin.lastName}`
                    : assignedAdmin.name || "ผู้ดูแลระบบ"}
                </Text>
              </div>
            </Tooltip>
          )}
        </div>

        {/* เพิ่มส่วนแสดงเหตุผลการปฏิเสธ */}
        {readOnly &&
          (issue.status === "rejected" || issue.status === "ถูกปฏิเสธ") &&
          rejectReason && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex items-start">
                <div className="text-red-500 font-medium text-sm">
                  เหตุผลที่ถูกปฏิเสธ:
                </div>
              </div>
              <div className="mt-1 text-sm text-gray-700 bg-red-50 p-2 rounded border-l-2 border-red-300">
                {rejectReason}
              </div>
            </div>
          )}

        {/* แสดงไฟล์แนบ */}
        {fileUrl && (
          <div className="mt-4 pt-3 border-t border-gray-400">
            <Text strong className="text-sm mb-2 block">
              ไฟล์แนบ:
            </Text>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-500 hover:text-blue-700">
              {fileType === "image" && (
                <FileImageOutlined style={{ color: "#1890ff" }} />
              )}
              {fileType === "pdf" && (
                <FilePdfOutlined style={{ color: "#ff0000" }} />
              )}
              {fileType === "word" && (
                <FileWordOutlined style={{ color: "#2b579a" }} />
              )}
              {fileType === "other" && <FileOutlined />}
              <span className="ml-2 truncate max-w-[140px] sm:max-w-[180px]">
                {fileName}
              </span>
            </a>
          </div>
        )}
      </Card>

      {/* Modal สำหรับให้คะแนนดาว - ปรับขนาดตามหน้าจอ */}
      <Modal
        title="ให้คะแนนการแก้ไขปัญหา"
        open={ratingModalVisible}
        onCancel={() => setRatingModalVisible(false)}
        width={window.innerWidth < 768 ? "90%" : 400}
        footer={[
          <Button key="cancel" onClick={() => setRatingModalVisible(false)}>
            ยกเลิก
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleRatingSubmit}
            style={{
              backgroundColor: "#262362",
              transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#193CB8")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#262362")}>
            บันทึกคะแนน
          </Button>,
        ]}>
        <div className="py-4">
          <p className="mb-4 text-center">
            กรุณาให้คะแนนความพึงพอใจในการให้บริการ
          </p>
          <div className="flex justify-center">
            <Rate
              allowHalf
              value={rating}
              onChange={setRating}
              style={{ fontSize: window.innerWidth < 768 ? 28 : 36 }}
            />
          </div>
          <p className="mt-4 text-center text-sm text-gray-500">
            {rating === 5
              ? "ยอดเยี่ยม!"
              : rating >= 4
              ? "ดีมาก"
              : rating >= 3
              ? "พอใช้"
              : rating >= 2
              ? "ควรปรับปรุง"
              : rating >= 1
              ? "แย่มาก"
              : "กรุณาเลือกคะแนน"}
          </p>
        </div>
      </Modal>
    </>
  );
};

IssueCard.propTypes = {
  issue: PropTypes.shape({
    issueId: PropTypes.string,
    _id: PropTypes.string,
    id: PropTypes.string,
    userId: PropTypes.string,
    topic: PropTypes.string,
    title: PropTypes.string,
    issue: PropTypes.string,
    description: PropTypes.string,
    date: PropTypes.string,
    file: PropTypes.string,
    status: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    rating: PropTypes.number,
    comment: PropTypes.string, // เพิ่ม comment สำหรับเหตุผลการปฏิเสธ
    assignedAdmin: PropTypes.shape({
      _id: PropTypes.string,
      id: PropTypes.string,
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      name: PropTypes.string,
      role: PropTypes.string,
      profileImage: PropTypes.string,
      profilePicture: PropTypes.string,
    }),
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  readOnly: PropTypes.bool,
  onRatingChange: PropTypes.func,
};

export default IssueCard;
