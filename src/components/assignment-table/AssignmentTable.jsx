import { useState, useEffect, useRef, useCallback } from "react";
import {
  Layout,
  Table,
  Button,
  message,
  theme,
  Avatar,
  Space,
  Tooltip,
  Tag,
  Input,
  Badge,
  Dropdown,
  Modal,
} from "antd";
import {
  ReloadOutlined,
  UserOutlined,
  FileTextOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import PropTypes from "prop-types"; // เพิ่มการนำเข้า PropTypes

import AssignAdminModal from "./AssignAdminModal";
import ReportDetailModal from "./ReportDetailModal";
import TableSkeleton from "../skeletons/TableSkeleton";
import { useSocket } from "../../context/SocketContext";
import { API_BASE_URL } from "../../utils/baseApi"
// import { useUser } from "../../context/UserContext"; // Add missing import

const { Content } = Layout;
const { Search } = Input;

// API Base URL


const AssignmentTable = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // State variables
  const [dataSource, setDataSource] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  // ลบตัวแปร searchText ที่ไม่ได้ใช้งาน

  // Modal states
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const tableRef = useRef(null);
  const { socket } = useSocket();
  // const { user } = useUser(); // Add user context

  // เพิ่ม state สำหรับ Modal เหตุผลการปฏิเสธ
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingRecord, setRejectingRecord] = useState(null);
  const [rejectingLoading, setRejectingLoading] = useState(false);

  // ฟังก์ชันแปลงข้อมูลจาก API ไปเป็นรูปแบบที่เหมาะสมสำหรับตาราง
  const transformReportData = (report, index) => {
    return {
      key: report.issueId || report._id || index,
      issueId: report.issueId || report._id,
      topic: report.topic || report.title || report.issue || `Issue ${index}`,
      description: report.description || null,
      date: report.date || report.createdAt,
      status: report.status || "รอดำเนินการ",
      file: report.file || null,

      // ข้อมูลผู้แจ้งปัญหา
      userId: report.userId || null,
      employeeId: report.userId?.employeeId || null,
      employeeName:
        report.userId?.employeeName ||
        (report.userId?.firstName && report.userId?.lastName
          ? `${report.userId.firstName} ${report.userId.lastName}`
          : report.userId?.firstName ||
            report.userId?.lastName ||
            "ไม่ระบุชื่อ"),
      department: report.userId?.department || "ไม่ระบุแผนก",
      position: report.userId?.position || null,
      email: report.userId?.email || null,
      phoneNumber: report.userId?.phoneNumber || null,
      profileImage:
        report.userId?.profileImage || report.userId?.profilePicture || null,

      // ผู้รับผิดชอบ
      assignedAdmin: report.assignedAdmin || null,

      // ข้อมูลเพิ่มเติม
      response: report.response || null,
      updatedAt: report.updatedAt || null,
    };
  };

  // ดึงข้อมูลคำร้องทั้งหมดจาก API สำหรับ admin
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_BASE_URL}/reports/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // console.log("Fetched all reports:", response.data);

      // ตรวจสอบรูปแบบการตอบกลับ
      let reportsData = [];
      if (response.data && Array.isArray(response.data.data)) {
        reportsData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        reportsData = response.data;
      } else {
        // console.warn("Unexpected API response format:", response.data);
        reportsData = [];
      }

      // แปลงข้อมูลจาก API ให้อยู่ในรูปแบบที่ Table ต้องการ
      const formattedData = reportsData.map((report, index) =>
        transformReportData(report, index)
      );

      // กรองออกรายการที่มีสถานะเป็น "rejected" หรือ "completed"
      const filteredData = formattedData.filter(
        (item) => item.status !== "rejected" && item.status !== "completed"
      );

      setDataSource(filteredData);
      setFilteredData(filteredData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      if (error.response?.status === 403) {
        message.error("คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้");
      } else {
        message.error("ไม่สามารถโหลดข้อมูลคำร้องได้");
      }
      setDataSource([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ดึงข้อมูลแอดมินทั้งหมดสำหรับใช้ในการมอบหมายงาน
  const fetchAdmins = useCallback(async () => {
    try {
      setLoadingAdmins(true);
      const token = localStorage.getItem("token");

      // เรียก API เพื่อดึงรายชื่อผู้ใช้ทั้งหมด
      const response = await axios.get(`${API_BASE_URL}/users/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (
        response.data &&
        (Array.isArray(response.data.data) || Array.isArray(response.data))
      ) {
        // ดึงข้อมูลผู้ใช้ทั้งหมด
        const allUsers = Array.isArray(response.data.data)
          ? response.data.data
          : response.data;

        // กรองเฉพาะผู้ใช้ที่มี role เป็น Admin หรือ SuperAdmin
        const filteredAdmins = allUsers.filter(
          (user) => user.role === "Admin" || user.role === "SuperAdmin"
        );

        setAdmins(filteredAdmins);
        // console.log("Filtered admins:", filteredAdmins);
      } else {
        console.warn(
          "Unexpected API response format for admins:",
          response.data
        );
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      message.error("ไม่สามารถดึงข้อมูลผู้ดูแลระบบได้");
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  // โหลดข้อมูลเมื่อคอมโพเนนต์ mount
  useEffect(() => {
    fetchReports();
    fetchAdmins();
  }, [fetchReports, fetchAdmins]);

  // แสดง Modal มอบหมายงาน
  const showAssignModal = (record) => {
    setCurrentRecord(record);
    setAssignModalVisible(true);
  };

  // แสดง Modal รายละเอียด
  const showDetailModal = (record) => {
    setCurrentRecord(record);
    setDetailModalVisible(true);
  };

  // อัพเดตสถานะคำร้อง
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
      const issueId = record.issueId || record._id;

      // ตรวจสอบว่า status ที่ส่งตรงกับที่ API รองรับ
      if (
        !["pending", "approved", "rejected", "completed"].includes(newStatus)
      ) {
        // แปลงสถานะภาษาไทยเป็นภาษาอังกฤษ
        if (newStatus === "รอดำเนินการ") newStatus = "pending";
        else if (newStatus === "อนุมัติแล้ว") newStatus = "approved";
        else if (newStatus === "ถูกปฏิเสธ") newStatus = "rejected";
        else if (newStatus === "เสร็็จสิ้น") newStatus = "completed";
      }

      // ส่งคำขอ API เพื่ออัพเดตสถานะ
      await axios.put(
        `${API_BASE_URL}/reports/edit/${issueId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // ถ้าสถานะใหม่เป็น "rejected" หรือ "completed" ให้ลบรายการนั้นออกจากตาราง
      if (newStatus === "rejected" || newStatus === "completed") {
        const newData = dataSource.filter((item) => item.key !== record.key);
        setDataSource(newData);
        setFilteredData(filteredData.filter((item) => item.key !== record.key));

        const statusText =
          newStatus === "completed" ? "เสร็จสิ้น" : "ถูกปฏิเสธ";
        message.success(
          `รายการถูกปรับสถานะเป็น ${statusText} และย้ายไปยังรายงาน`
        );

        // ส่ง socket event เพื่อแจ้งเตือนผู้ใช้
        if (socket) {
          socket.emit("reportStatusUpdate", {
            issueId: issueId,
            status: newStatus,
            topic: record.topic || "คำร้อง",
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

        // ส่ง socket event เพื่อแจ้งเตือนผู้ใช้
        if (socket) {
          socket.emit("reportStatusUpdate", {
            issueId: issueId,
            status: newStatus,
            topic: record.topic || "คำร้อง",
          });
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      message.error(
        "ไม่สามารถอัพเดตสถานะได้: " +
          (error.response?.data?.message || "เกิดข้อผิดพลาด")
      );
    }
  };

  // เพิ่มฟังก์ชันเพื่อจัดการการปฏิเสธคำร้องพร้อมเหตุผล
  const handleRejectWithReason = async () => {
    if (!rejectingRecord) return;

    try {
      setRejectingLoading(true);
      const token = localStorage.getItem("token");
      const issueId = rejectingRecord.issueId || rejectingRecord._id;

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
          topic: rejectingRecord.topic || "คำร้อง",
          comment: rejectReason || "ไม่ได้ระบุเหตุผล", // ส่งเหตุผลไปพร้อมกับการแจ้งเตือน
        });
      }

      // ปิด Modal
      setRejectModalVisible(false);
      setRejectingRecord(null);
      setRejectReason("");
    } catch (error) {
      console.error("Error rejecting issue with reason:", error);
      message.error(
        "ไม่สามารถปฏิเสธคำร้องได้: " +
          (error.response?.data?.message || "เกิดข้อผิดพลาด")
      );
    } finally {
      setRejectingLoading(false);
    }
  };

  // ฟังก์ชันสำหรับค้นหา - ปรับปรุงให้ไม่ต้องใช้ตัวแปร searchText
  const handleSearch = (value) => {
    if (!value) {
      setFilteredData(dataSource);
      return;
    }

    const lowercasedValue = value.toLowerCase();
    const filtered = dataSource.filter(
      (item) =>
        (item.topic && item.topic.toLowerCase().includes(lowercasedValue)) ||
        (item.description &&
          item.description.toLowerCase().includes(lowercasedValue)) ||
        (item.employeeName &&
          item.employeeName.toLowerCase().includes(lowercasedValue)) ||
        (item.department &&
          item.department.toLowerCase().includes(lowercasedValue))
    );

    setFilteredData(filtered);
  };

  // แปลงสถานะเป็นภาษาไทย
  const getStatusText = (status) => {
    const statusMapping = {
      pending: "รอดำเนินการ",
      approved: "อนุมัติแล้ว", // แก้ไขจาก completed เป็น approved
      rejected: "ถูกปฏิเสธ",
      completed: "เสร็จสิ้น",
    };
    return statusMapping[status] || status;
  };

  // กำหนดสีของสถานะ
  const getStatusColor = (status) => {
    const statusColors = {
      pending: "orange",
      approved: "blue", // แก้ไขจาก completed เป็น approved
      rejected: "red",
      completed: "green",
      รอดำเนินการ: "orange",
      อนุมัติแล้ว: "blue", // แก้ไขจาก เสร็จสิ้น เป็น อนุมัติแล้ว
      ถูกปฏิเสธ: "red",
      เสร็จสิ้น: "green",
    };
    return statusColors[status] || "default";
  };

  // ทำหน้าที่แทน ActionsColumn: รวมเข้ากับโค้ดโดยตรงเพื่อไม่ต้องสร้างไฟล์แยก
  const ActionsColumn = ({
    record,
    onAssign,
    onViewDetail,
    onStatusChange,
  }) => {
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const menuItems = [
      {
        key: "1",
        label: (
          <span onClick={() => onViewDetail(record)}>
            <FileTextOutlined /> ดูรายละเอียด
          </span>
        ),
      },
      {
        key: "2",
        label: (
          <span onClick={() => onAssign(record)}>
            <UserOutlined /> มอบหมายงาน
          </span>
        ),
      },
      {
        type: "divider",
      },
      {
        key: "3",
        label: (
          <span onClick={() => onStatusChange(record, "approved")}>
            <CheckCircleOutlined /> อนุมัติ
          </span>
        ),
        disabled: record.status === "approved",
      },
      {
        key: "4",
        label: (
          <span onClick={() => onStatusChange(record, "pending")}>
            <ClockCircleOutlined /> รอดำเนินการ
          </span>
        ),
        disabled: record.status === "pending",
      },
      {
        key: "5",
        label: (
          <span onClick={() => onStatusChange(record, "rejected")}>
            <CloseCircleOutlined /> ปฏิเสธคำร้อง
          </span>
        ),
        danger: true,
        disabled: record.status === "rejected",
      },
    ];

    return (
      <Dropdown
        menu={{ items: menuItems }}
        trigger={["click"]}
        open={dropdownVisible}
        onOpenChange={setDropdownVisible}>
        <Button
          type="text"
          icon={<MoreOutlined />}
          style={{ borderRadius: "50%" }}
        />
      </Dropdown>
    );
  };

  // เพิ่ม prop types validation สำหรับ ActionsColumn
  ActionsColumn.propTypes = {
    record: PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      status: PropTypes.string.isRequired, // เพิ่มการตรวจสอบ record.status
      // เพิ่ม props อื่นๆ ของ record ที่จำเป็นตามต้องการ
    }).isRequired,
    onAssign: PropTypes.func.isRequired,
    onViewDetail: PropTypes.func.isRequired,
    onStatusChange: PropTypes.func.isRequired,
  };

  // คอลัมน์ของตาราง
  const columns = [
    {
      title: "Issue",
      dataIndex: "topic",
      key: "topic",
      width: "25%",
      ellipsis: false, // ตัดข้อความที่ยาวเกินไป
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
      responsive: ["xs", "sm", "md", "lg", "xl"], // แสดงในทุกขนาดหน้าจอ
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: "10%",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      responsive: ["sm", "md", "lg", "xl"], // ไม่แสดงในขนาด xs (มือถือ)
      sorter: (a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      },
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Submitter",
      dataIndex: "employeeName",
      key: "employeeName",
      width: "20%",
      ellipsis: true,
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.profileImage}
            icon={!record.profileImage && <UserOutlined />}>
            {!record.profileImage && record.employeeName
              ? record.employeeName[0].toUpperCase()
              : null}
          </Avatar>

          <div className="hidden sm:block">
            {" "}
            {/* ซ่อนข้อมูลเพิ่มเติมในมุมมองมือถือ แต่แสดง Avatar */}
            <div style={{ fontWeight: "500" }}>{record.employeeName}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              <div>{record.department || "ไม่ระบุแผนก"}</div>
              {record.position && <div>{record.position}</div>}
            </div>
          </div>
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
      responsive: ["xs", "sm", "md", "lg", "xl"], // แสดงในทุกขนาดหน้าจอ
    },
    {
      title: "Assigned Admin",
      dataIndex: "assignedAdmin",
      key: "assignedAdmin",
      width: "15%",
      render: (assignedAdmin, record) => (
        <div>
          {assignedAdmin ? (
            <Space>
              <Avatar
                src={assignedAdmin.profileImage}
                icon={!assignedAdmin.profileImage && <UserOutlined />}
              />
              <div className="hidden sm:block">
                {" "}
                {/* ซ่อนรายละเอียดในมุมมองมือถือ */}
                <div style={{ fontWeight: "500" }}>
                  {assignedAdmin.firstName} {assignedAdmin.lastName}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {assignedAdmin.role}
                </div>
              </div>
            </Space>
          ) : (
            <Button
              type="dashed"
              size="small"
              onClick={() => showAssignModal(record)}>
              มอบหมาย
            </Button>
          )}
        </div>
      ),
      responsive: ["sm", "md", "lg", "xl"], // ไม่แสดงในขนาด xs (มือถือ)
    },
    {
      title: "Actions",
      key: "action",
      width: "10%",
      render: (_, record) => (
        <ActionsColumn
          record={record}
          onAssign={() => showAssignModal(record)}
          onViewDetail={() => showDetailModal(record)}
          onStatusChange={handleStatusChange}
        />
      ),
      responsive: ["xs", "sm", "md", "lg", "xl"], // แสดงในทุกขนาดหน้าจอ
    },
  ];

  return (
    <Layout>
      <Content
        style={{
          borderRadius: borderRadiusLG,
          background: colorBgContainer,
          padding: 24,
        }}>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
          {/* ช่องค้นหา - จะอยู่ด้านบนในมือถือ และด้านซ้ายในจอใหญ่ */}
          <div className="w-full sm:w-auto">
            <Search
              placeholder="ค้นหาคำร้อง..."
              allowClear
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          {/* ปุ่มรีเฟรช - จะอยู่ด้านล่างในมือถือ และด้านขวาในจอใหญ่ */}
          <div>
            <Button
              type="primary"
              onClick={fetchReports}
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
        ) : (
          <div className="overflow-x-auto">
            <Table
              ref={tableRef}
              dataSource={filteredData}
              columns={columns}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `ทั้งหมด ${total} รายการ`,
                responsive: true,
                showSizeChanger: true,
              }}
              scroll={{ x: "max-content" }}
              size={window.innerWidth < 768 ? "small" : "middle"} // ปรับขนาดตารางตามขนาดหน้าจอ
              rowClassName="whitespace-normal"
            />
          </div>
        )}

        {/* Modal สำหรับมอบหมายงาน */}
        <AssignAdminModal
          visible={assignModalVisible}
          onCancel={() => setAssignModalVisible(false)}
          record={currentRecord}
          admins={admins}
          loadingAdmins={loadingAdmins}
          onRefresh={fetchReports}
          API_BASE_URL={API_BASE_URL}
        />

        {/* Modal สำหรับแสดงรายละเอียด */}
        <ReportDetailModal
          visible={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          record={currentRecord}
          onAssign={() => {
            setDetailModalVisible(false);
            if (currentRecord) showAssignModal(currentRecord);
          }}
          onRefresh={fetchReports}
          API_BASE_URL={API_BASE_URL}
        />

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

export default AssignmentTable;
