import { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Table,
  Button,
  Space,
  Dropdown,
  message,
  theme,
  Avatar,
  Modal,
  Tag,
  Input,
  Badge,
  Tooltip,
  Empty,
  Image,
  Divider,
} from "antd";
import {
  EllipsisOutlined,
  MessageOutlined,
  ReloadOutlined,
  FileTextOutlined,
  UserOutlined,
  InfoOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { Link } from "react-router";
import TableSkeleton from "../skeletons/TableSkeleton";
import axios from "axios";
import dayjs from "dayjs";
import { useUser } from "../../context/UserContext";
import { useSocket } from "../../context/SocketContext"; // Add missing import
import { API_BASE_URL } from "../../utils/baseApi"
const { Content } = Layout;
const { Search } = Input;

// API Base URL


const ContentTable = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { user } = useUser();
  const { socket } = useSocket(); // Add missing socket access

  const [dataSource, setDataSource] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // เพิ่ม state สำหรับ Modal เหตุผลการปฏิเสธ
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingRecord, setRejectingRecord] = useState(null);
  const [rejectingLoading, setRejectingLoading] = useState(false);

  // อัพเดตฟังก์ชันดึงข้อมูลคำร้องที่มอบหมายให้กับผู้ใช้ที่ล็อกอินอยู่
  const fetchAssignedReports = useCallback(async () => {
    try {
      setLoading(true);

      // ตรวจสอบว่ามี user และ user.id หรือไม่
      if (!user || (!user.id && !user._id)) {
        message.error("ไม่พบข้อมูลผู้ใช้");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      const userId = user.id || user._id;

      // console.log("Fetching reports assigned to user ID:", user.id || user._id);

      // เรียกใช้ API เพื่อดึงคำร้องที่มอบหมายให้กับผู้ใช้นี้
      const response = await axios.get(
        `${API_BASE_URL}/reports/admin/assigned/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // console.log("Assigned reports response:", response.data);

      // ดึงข้อมูลคำร้องจากการตอบกลับของ API
      let assignedReports = [];
      if (response.data && Array.isArray(response.data.data)) {
        assignedReports = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        assignedReports = response.data;
      } else {
        console.warn("Unexpected API response format:", response.data);
      }

      // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสมสำหรับตาราง
      // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสมสำหรับตาราง
      const formattedData = assignedReports.map((report, index) => ({
        key: report.issueId || report._id || index,
        id: report.issueId || report._id,
        issue: report.topic || report.title || report.issue || `Issue ${index}`,
        description: report.description || null,
        date: report.date || report.createdAt,
        status: report.status || "รอดำเนินการ",
        file: report.file || null,

        // ข้อมูลผู้แจ้ง
        name: report.userId?.firstName
          ? `${report.userId.firstName} ${report.userId?.lastName || null}`
          : report.userId?.employeeName || "ไม่ระบุชื่อ",
        department: report.userId?.department || "ไม่ระบุแผนก",
        position: report.userId?.position || null,
        email: report.userId?.email || null, // เพิ่ม optional chaining ตรงนี้
        phoneNumber: report.userId?.phoneNumber || null,
        profilePic:
          report.userId?.profileImage || report.userId?.profilePicture || null,

        // เก็บข้อมูล original เพื่อใช้ในการแสดงรายละเอียด
        originalData: report,
      }));

      // console.log("Formatted assigned reports:", formattedData);

      // กรองเอาเฉพาะรายการที่ไม่ได้ถูกปฏิเสธหรือเสร็จสิ้น
      const filteredReports = formattedData.filter(
        (report) =>
          report.status !== "rejected" && report.status !== "completed"
      );

      setDataSource(filteredReports);
      setFilteredData(filteredReports);
    } catch (error) {
      console.error("Error fetching assigned reports:", error);
      message.error("ไม่สามารถดึงข้อมูลคำร้องที่มอบหมายได้");
      setDataSource([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // เรียกดึงข้อมูลเมื่อมีการเปลี่ยนแปลง user หรือ component mount
  useEffect(() => {
    fetchAssignedReports();
  }, [fetchAssignedReports]);

  // ฟังก์ชันสำหรับค้นหา
  const handleSearch = (value) => {
    if (!value) {
      setFilteredData(dataSource);
      return;
    }

    const lowercasedValue = value.toLowerCase();
    const filtered = dataSource.filter(
      (item) =>
        (item.issue && item.issue.toLowerCase().includes(lowercasedValue)) ||
        (item.description &&
          item.description.toLowerCase().includes(lowercasedValue)) ||
        (item.name && item.name.toLowerCase().includes(lowercasedValue)) ||
        (item.department &&
          item.department.toLowerCase().includes(lowercasedValue))
    );

    setFilteredData(filtered);
  };

  // แปลงสถานะเป็นภาษาไทยและกำหนดสี
  const getStatusText = (status) => {
    const statusMapping = {
      pending: "รอดำเนินการ",
      approved: "อนุมัติแล้ว",
      rejected: "ถูกปฏิเสธ",
      completed: "เสร็จสิ้น",
    };
    return statusMapping[status] || status;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "orange",
      approved: "blue",
      rejected: "red",
      completed: "green",
      รอดำเนินการ: "orange",
      อนุมัติแล้ว: "blue",
      ถูกปฏิเสธ: "red",
      เสร็จสิ้น: "green",
    };
    return statusColors[status] || "default";
  };

  // แก้ไขฟังก์ชัน handleStatusChange เพื่อจัดการกรณีปฏิเสธคำร้อง
  const handleStatusChange = async (record, newStatus) => {
    // กรณีปฏิเสธคำร้อง จะแสดง Modal ให้กรอกเหตุผล
    if (newStatus === "rejected") {
      setRejectingRecord(record);
      setRejectReason("");
      setRejectModalVisible(true);
      return; // ออกจากฟังก์ชันก่อน ไม่ดำเนินการต่อจนกว่าจะกรอกเหตุผล
    }

    try {
      const token = localStorage.getItem("token");
      const issueId = record.id || record.issueId;

      // ส่งคำขอ API เพื่ออัพเดตสถานะ
      await axios.put(
        `${API_BASE_URL}/reports/edit/${issueId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ถ้าสถานะใหม่เป็น "completed" หรือ "rejected" ให้ลบรายการนั้นออกจากตาราง
      if (newStatus === "completed" || newStatus === "rejected") {
        // ลบรายการนั้นออกจากตาราง
        const newData = dataSource.filter((item) => item.key !== record.key);
        setDataSource(newData);
        setFilteredData(filteredData.filter((item) => item.key !== record.key));

        const statusText =
          newStatus === "completed" ? "เสร็จสิ้น" : "ถูกปฏิเสธ";
        message.success(
          `รายการถูกปรับสถานะเป็น ${statusText} และถูกย้ายไปยังรายงาน`
        );

        // ใช้ updateReportStatus function แทนการใช้ socket.emit โดยตรง
        if (socket) {
          socket.emit("reportStatusUpdate", {
            issueId: record.id || record.issueId,
            status: newStatus,
            topic: record.issue || record.topic || "คำร้อง",
          });
        }
      } else {
        // อัพเดตข้อมูลในตารางตามปกติ
        const newData = dataSource.map((item) => {
          if (item.key === record.key) {
            return { ...item, status: newStatus };
          }
          return item;
        });

        setDataSource(newData);
        setFilteredData(
          filteredData.map((item) => {
            if (item.key === record.key) {
              return { ...item, status: newStatus };
            }
            return item;
          })
        );

        message.success(`อัพเดตสถานะเป็น ${getStatusText(newStatus)} สำเร็จ`);

        // ใช้ updateReportStatus function
        if (socket) {
          socket.emit("reportStatusUpdate", {
            issueId: record.id || record.issueId,
            status: newStatus,
            topic: record.issue || record.topic || "คำร้อง",
          });
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("ไม่สามารถอัพเดตสถานะได้");
    }
  };

  // เพิ่มฟังก์ชันเพื่อจัดการการปฏิเสธคำร้องพร้อมเหตุผล
  const handleRejectWithReason = async () => {
    if (!rejectingRecord) return;

    try {
      setRejectingLoading(true);
      const token = localStorage.getItem("token");
      const issueId = rejectingRecord.id || rejectingRecord.issueId;

      // ส่งคำขอ API เพื่ออัพเดตสถานะพร้อมเหตุผลการปฏิเสธ
      await axios.put(
        `${API_BASE_URL}/reports/edit/${issueId}`,
        {
          status: "rejected",
          comment: rejectReason || "ไม่ได้ระบุเหตุผล", // ส่งเหตุผลไปด้วย
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // ลบรายการนั้นออกจากตาราง
      const newData = dataSource.filter(
        (item) => item.key !== rejectingRecord.key
      );
      setDataSource(newData);
      setFilteredData(
        filteredData.filter((item) => item.key !== rejectingRecord.key)
      );

      message.success("ปฏิเสธคำร้องพร้อมระบุเหตุผลเรียบร้อยแล้ว");

      // ส่ง socket event เพื่อแจ้งเตือนผู้ใช้ พร้อมเหตุผลการปฏิเสธ
      if (socket) {
        socket.emit("reportStatusUpdate", {
          issueId: issueId,
          status: "rejected",
          topic: rejectingRecord.issue || rejectingRecord.topic || "คำร้อง",
          comment: rejectReason || "ไม่ได้ระบุเหตุผล", // ส่งเหตุผลไปพร้อมกับการแจ้งเตือน
        });
      }

      // ปิด Modal
      setRejectModalVisible(false);
      setRejectingRecord(null);
      setRejectReason("");
    } catch (error) {
      console.error("Error rejecting issue with reason:", error);
      message.error("ไม่สามารถปฏิเสธคำร้องได้");
    } finally {
      setRejectingLoading(false);
    }
  };

  // ฟังก์ชันเพิ่มเติมสำหรับตรวจสอบประเภทไฟล์
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

  // ฟังก์ชันเพิ่มเติมสำหรับแสดงไฟล์แนบ
  const renderAttachment = (fileUrl) => {
    if (!fileUrl) return null;

    const fileType = getFileType(fileUrl);

    return (
      <div className="mt-4">
        <h4 className="mb-2 font-semibold">ไฟล์แนบ</h4>
        {fileType === "image" ? (
          <div className="border rounded p-2">
            <Image
              src={fileUrl}
              alt="Attachment"
              style={{ maxWidth: "100%", maxHeight: "300px" }}
            />
          </div>
        ) : (
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer">
            ดูไฟล์แนบ
          </Button>
        )}
      </div>
    );
  };

  // แก้ไขฟังก์ชัน showDetailModal
  const showDetailModal = (record) => {
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  // แก้ไขฟังก์ชัน handleCancel
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
  };

  // แก้ไข dropdown menu items
  const getActionMenu = (record) => ({
    items: [
      {
        key: "1",
        label: "รอดำเนินการ",
        icon: <ClockCircleOutlined />,
        onClick: () => handleStatusChange(record, "pending"),
      },
      {
        key: "2",
        label: "เสร็จสิ้น",
        icon: <CheckCircleOutlined />,
        onClick: () => handleStatusChange(record, "completed"),
      },
      {
        key: "3",
        label: "ปฏิเสธคำร้อง",
        icon: <CloseCircleOutlined />,
        danger: true,
        onClick: () => handleStatusChange(record, "rejected"),
      },
    ],
  });

  // คอลัมน์ของตาราง
  const columns = [
    {
      title: "Issue",
      dataIndex: "issue",
      key: "issue",
      width: "25%",
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{text}</span>
            {record.file && (
              <Tooltip title="มีไฟล์แนบ">
                <Badge status="processing" color="blue" />
              </Tooltip>
            )}
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            {record.description && record.description.length > 60
              ? `${record.description.substring(0, 60)}...`
              : record.description}
          </div>
          <Button
            type="link"
            size="small"
            onClick={() => showDetailModal(record)}
            style={{ padding: "0", height: "auto", marginTop: "4px" }}>
            <span className="text-blue-500 text-xs flex items-center">
              <FileTextOutlined style={{ marginRight: "4px" }} />
              ดูรายละเอียดเพิ่มเติม
            </span>
          </Button>
        </div>
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: "12%",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      responsive: ["sm", "md", "lg", "xl"],
      sorter: (a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      },
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Submitter",
      dataIndex: "name",
      key: "name",
      width: "20%",
      render: (text, record) => (
        <Space>
          <Avatar
            src={record.profilePic}
            icon={!record.profilePic && <UserOutlined />}
          />
          <div className="hidden sm:block">
            <div style={{ fontWeight: "500" }}>{text}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {record.department}
            </div>
          </div>
          <Link to={"/messages"} className="ml-2">
            <Button
              style={{ borderRadius: "50%", height: "30px", width: "30px" }}
              icon={<MessageOutlined />}
            />
          </Link>
        </Space>
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "12%",
      filters: [
        { text: "รอดำเนินการ", value: "pending" },
        { text: "อนุมัติแล้ว", value: "approved" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      title: "Actions",
      key: "action",
      width: "10%",
      render: (_, record) => (
        <Space>
          <Button
            style={{ borderRadius: "50%", height: "30px", width: "30px" }}
            onClick={() => showDetailModal(record)}
            icon={<InfoOutlined />}
          />
          <Dropdown menu={getActionMenu(record)}>
            <Button
              style={{ borderRadius: "50%", height: "30px", width: "30px" }}
              icon={<EllipsisOutlined />}
            />
          </Dropdown>
        </Space>
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
  ];

  return (
    <Layout>
      <Content
        style={{
          margin: "30px 16px",
          padding: 24,
          borderRadius: borderRadiusLG,
          background: colorBgContainer,
        }}>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
          {/* ช่องค้นหา */}
          <div className="w-full sm:w-auto">
            <Search
              placeholder="ค้นหาคำร้อง..."
              allowClear
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          {/* ปุ่มรีเฟรช */}
          <div>
            <Button
              type="primary"
              onClick={fetchAssignedReports}
              style={{
                backgroundColor: "#262362",
                transition: "background-color 0.3s",
                border: "none",
                borderRadius: "50%",
                height: "32px",
                width: "32px",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#193CB8")}
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "#262362")
              }>
              <ReloadOutlined />
            </Button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : dataSource.length === 0 ? (
          <Empty
            description="ไม่พบคำร้องที่มอบหมายให้คุณ"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table
              dataSource={filteredData}
              columns={columns}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `ทั้งหมด ${total} รายการ`,
                responsive: true,
                showSizeChanger: true,
              }}
              scroll={{ x: "max-content" }}
              size={window.innerWidth < 768 ? "small" : "middle"}
              rowClassName="whitespace-normal"
            />
          </div>
        )}

        {editingRecord && (
          <Modal
            title={<span>{editingRecord.issue}</span>}
            open={isModalVisible}
            onCancel={handleCancel}
            footer={[
              <Button key="close" onClick={handleCancel}>
                ปิด
              </Button>,
            ]}
            width={700}>
            <Divider style={{ margin: "16px 0" }} />
            {/* แสดงรายละเอียดของคำร้อง */}
            <div className="mb-4">
              <h4 className="mb-2 font-semibold">รายละเอียด</h4>
              <p>{editingRecord.description}</p>
            </div>
            <Divider style={{ margin: "16px 0" }} />
            <div className="mb-4 ">
              <h4 className="mb-4 font-semibold">ข้อมูลผู้แจ้ง</h4>
              <Space className="flex flex-col sm:flex-row items-center">
                <Avatar
                  className="flex-shrink-0"
                  src={editingRecord.profilePic}
                  size={64}
                  icon={
                    !editingRecord.profilePic && (
                      <UserOutlined style={{ fontSize: "28px" }} />
                    )
                  }
                />
                <div className="flex flex-col space-y-1 ml-2">
                  <div className="font-medium text-base">
                    ชื่อ : {editingRecord.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    แผนก : {editingRecord.department}
                  </div>
                  <div className="text-xs text-gray-500">
                    email : {editingRecord.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    เบอร์โทรศัพท์ : {editingRecord.phoneNumber}
                  </div>
                </div>
              </Space>
            </div>
            <Divider style={{ margin: "16px 0" }} />
            <div className="mb-4">
              <h4 className="mb-2 font-semibold">สถานะ</h4>
              <Tag color={getStatusColor(editingRecord.status)}>
                {getStatusText(editingRecord.status)}
              </Tag>
            </div>
            <Divider style={{ margin: "16px 0" }} />
            <div className="mb-4">
              <h4 className="mb-2 font-semibold">วันที่แจ้ง</h4>
              <p>{dayjs(editingRecord.date).format("DD/MM/YYYY")}</p>
            </div>
            <Divider style={{ margin: "16px 0" }} />
            {/* แก้ไขการแสดงไฟล์แนบให้ใช้ renderAttachment function */}
            {editingRecord.file && renderAttachment(editingRecord.file)}
          </Modal>
        )}

        {/* เพิ่ม Modal สำหรับกรอกเหตุผลการปฏิเสธ */}
        <Modal
          title="ระบุเหตุผลการปฏิเสธคำร้อง"
          open={rejectModalVisible}
          onCancel={() => {
            if (!rejectingLoading) {
              setRejectModalVisible(false);
              setRejectingRecord(null);
              setRejectReason("");
            }
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                if (!rejectingLoading) {
                  setRejectModalVisible(false);
                  setRejectingRecord(null);
                  setRejectReason("");
                }
              }}
              disabled={rejectingLoading}>
              ยกเลิก
            </Button>,
            <Button
              key="submit"
              type="primary"
              danger
              onClick={handleRejectWithReason}
              loading={rejectingLoading}>
              ยืนยันการปฏิเสธ
            </Button>,
          ]}>
          <div>
            <p>กรุณาระบุเหตุผลในการปฏิเสธคำร้องนี้ เพื่อแจ้งให้ผู้ใช้ทราบ:</p>
            <Input.TextArea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="ระบุเหตุผลการปฏิเสธคำร้องนี้..."
              autoSize={{ minRows: 3, maxRows: 6 }}
              style={{ marginTop: "10px" }}
            />
          </div>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ContentTable;
