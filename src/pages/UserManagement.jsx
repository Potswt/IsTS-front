import { useState, useEffect } from "react";
import {
  Table,
  Switch,
  Button,
  message,
  Input,
  Modal,
  Avatar,
  Spin,
  Tag,
  Dropdown,
  List,
  Empty,
} from "antd";
import {
  UserOutlined,
  ReloadOutlined,
  EllipsisOutlined,
  DeleteOutlined,
  HistoryOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { API_BASE_URL } from "../utils/baseApi"; // Import your API base URL from the utils file

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedDeleteUser, setSelectedDeleteUser] = useState(null);
  const [issuesModalVisible, setIssuesModalVisible] = useState(false);
  const [userIssues, setUserIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [selectedUserForIssues, setSelectedUserForIssues] = useState(null);
  const [assignedIssuesModalVisible, setAssignedIssuesModalVisible] =
    useState(false);
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [loadingAssignedIssues, setLoadingAssignedIssues] = useState(false);
  const [selectedUserForAssignedIssues, setSelectedUserForAssignedIssues] =
    useState(null);

  // Fetch users from existing API endpoint
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // ใช้ endpoint /users/all ที่มีอยู่แล้ว
      const response = await axios.get(`${API_BASE_URL}/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ตรวจสอบรูปแบบการตอบกลับที่ถูกต้อง
      let userData = [];
      if (response.data && Array.isArray(response.data.data)) {
        userData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        userData = response.data;
      } else {
        console.warn("Unexpected API response format:", response.data);
        userData = [];
      }

      // console.log("Fetched users:", userData);
      setUsers(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle status change using existing API
  const handleStatusChange = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      // ตรวจสอบค่า status ให้ตรงกับที่ API กำหนด
      if (!newStatus || !["active", "inactive"].includes(newStatus)) {
        message.error("สถานะต้องเป็น active หรือ inactive เท่านั้น");
        return;
      }

      // อัพเดตสถานะผู้ใช้ผ่าน API
      const response = await axios.put(
        `${API_BASE_URL}/users/resign/${userId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ถ้าสำเร็จ อัพเดตข้อมูลในตาราง
      if (response.data) {
        // อัพเดตข้อมูลในตารางโดยใช้ข้อมูลจาก API response
        setUsers(
          users.map((user) =>
            user._id === userId || user.id === userId
              ? {
                  ...user,
                  status: newStatus,
                  inactiveAt: newStatus === "inactive" ? new Date() : null,
                }
              : user
          )
        );

        message.success(
          response.data.message ||
            `อัพเดตสถานะผู้ใช้เป็น ${newStatus} เรียบร้อยแล้ว`
        );
      }
    } catch (error) {
      console.error("Error updating user status:", error);

      // จัดการข้อผิดพลาดตามรหัส HTTP ที่ได้รับ
      if (error.response) {
        switch (error.response.status) {
          case 400:
            // กรณีข้อมูลไม่ถูกต้องหรือสถานะซ้ำ
            message.error(error.response.data.message || "ข้อมูลไม่ถูกต้อง");
            break;
          case 404:
            message.error("ไม่พบข้อมูลผู้ใช้");
            break;
          case 403:
            message.error("คุณไม่มีสิทธิ์ในการเปลี่ยนสถานะผู้ใช้");
            break;
          default:
            message.error("ไม่สามารถอัพเดตสถานะผู้ใช้ได้");
        }
      } else {
        message.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      }
    }
  };

  // เพิ่มฟังก์ชันสำหรับลบผู้ใช้
  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");

      // ส่งคำขอลบผู้ใช้ไปยัง API
      await axios.delete(`${API_BASE_URL}/users/delete/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // อัพเดตข้อมูลผู้ใช้ในตาราง
      setUsers(
        users.filter((user) => user._id !== userId && user.id !== userId)
      );

      message.success("ลบผู้ใช้เรียบร้อยแล้ว");
      setConfirmModalVisible(false);
      setSelectedDeleteUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error("ไม่สามารถลบผู้ใช้ได้");
    }
  };

  // เพิ่มฟังก์ชันแสดง Modal ยืนยันการลบ
  const showDeleteConfirm = (user) => {
    setSelectedDeleteUser(user);
    setConfirmModalVisible(true);
  };

  // ฟังก์ชันดึงประวัติคำร้องของผู้ใช้
  const fetchUserIssues = async (user) => {
    try {
      setLoadingIssues(true);
      setSelectedUserForIssues(user);

      const token = localStorage.getItem("token");
      const userId = user._id || user.id;

      // เปลี่ยนมาใช้ endpoint /reports/admin/all แทน
      const endpoint = `${API_BASE_URL}/reports/admin/all`;

      console.log(`กำลังดึงข้อมูลคำร้องทั้งหมดจาก ${endpoint}`);

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ตรวจสอบรูปแบบการตอบกลับ
      let allIssues = [];
      if (response.data && Array.isArray(response.data.data)) {
        allIssues = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        allIssues = response.data;
      } else {
        console.warn("Unexpected API response format:", response.data);
        allIssues = [];
      }

      console.log(`ดึงข้อมูลคำร้องทั้งหมดได้ ${allIssues.length} รายการ`);

      // กรองเฉพาะคำร้องของผู้ใช้ที่เลือก
      const userIssues = allIssues.filter((issue) => {
        // ตรวจสอบว่ามี userId หรือไม่
        if (!issue.userId) return false;

        // กรณี userId เป็น object (มีการ populate ข้อมูล)
        if (typeof issue.userId === "object") {
          const issueUserId = issue.userId._id || issue.userId.id;
          return issueUserId === userId;
        }

        // กรณี userId เป็น string
        return issue.userId === userId;
      });

      console.log(
        `พบคำร้องของผู้ใช้ ${userId} จำนวน ${userIssues.length} รายการ`
      );

      setUserIssues(userIssues);
      setIssuesModalVisible(true);
    } catch (error) {
      console.error("Error fetching user issues:", error);
      message.error("ไม่สามารถดึงข้อมูลประวัติคำร้องของผู้ใช้ได้");
    } finally {
      setLoadingIssues(false);
    }
  };

  // แก้ไขในฟังก์ชัน fetchAssignedIssues
  const fetchAssignedIssues = async (user) => {
    try {
      setLoadingAssignedIssues(true);
      setSelectedUserForAssignedIssues(user);

      const token = localStorage.getItem("token");
      const userId = user._id || user.id;
      const currentUserData = JSON.parse(localStorage.getItem("user"));
      const currentUserRole = currentUserData?.role || "";

      console.log(`กำลังดึงข้อมูลคำร้องที่มอบหมายให้ ${userId}`);

      const endpoint = `${API_BASE_URL}/reports/admin/all`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ตรวจสอบรูปแบบการตอบกลับ
      let issueData = [];
      if (response.data && Array.isArray(response.data.data)) {
        issueData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        issueData = response.data;
      } else {
        console.warn("Unexpected API response format:", response.data);
        issueData = [];
      }

      console.log(
        `ข้อมูลคำร้องที่ได้รับจาก API (ผู้ใช้ ${userId}):`,
        issueData
      );

      // กรองข้อมูลเฉพาะคำร้องที่มอบหมายให้ userId ที่กำลังดู
      let filteredIssues = issueData.filter((issue) => {
        if (!issue.assignedAdmin) return false;

        const adminId = issue.assignedAdmin._id || issue.assignedAdmin.id;

        console.log(
          `เปรียบเทียบ assignedAdmin (${adminId}) กับ userId (${userId}): ${
            adminId === userId
          }`
        );

        return adminId === userId;
      });

      // แก้ไขตรงนี้: ลบการจำกัดการเข้าถึงสำหรับ Admin
      // เปลี่ยนเป็นให้ดูได้เฉพาะ SuperAdmin และ Admin
      if (currentUserRole !== "SuperAdmin" && currentUserRole !== "Admin") {
        // ถ้าไม่ใช่ SuperAdmin หรือ Admin ให้ดูได้เฉพาะของตัวเอง
        const currentUserId = currentUserData?.id || currentUserData?._id || "";
        if (currentUserId !== userId) {
          filteredIssues = []; // ถ้าดูข้อมูลคนอื่นให้เป็นค่าว่าง
        }
      }

      console.log(
        `คำร้องที่กรองแล้ว (${filteredIssues.length} รายการ):`,
        filteredIssues
      );

      setAssignedIssues(filteredIssues);
      setAssignedIssuesModalVisible(true);
    } catch (error) {
      console.error("Error fetching assigned issues:", error);
      message.error("ไม่สามารถดึงข้อมูลรายการคำร้องที่ได้รับมอบหมายได้");
    } finally {
      setLoadingAssignedIssues(false);
    }
  };

  // ฟังก์ชันแปลงสถานะเป็นภาษาไทย
  const getStatusText = (status) => {
    const statusMapping = {
      pending: "รอดำเนินการ",
      approved: "อนุมัติแล้ว",
      rejected: "ถูกปฏิเสธ",
      completed: "เสร็จสิ้น",
    };
    return statusMapping[status] || status;
  };

  // สีของแต่ละสถานะ
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

  // ฟังก์ชันนำทางไปยังหน้าคำร้องที่ได้รับมอบหมาย

  // Filter users by search text
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`
      .toLowerCase()
      .trim();
    const email = user.email?.toLowerCase() || "";
    const department = user.department?.toLowerCase() || "";
    const searchValue = searchText.toLowerCase();

    return (
      fullName.includes(searchValue) ||
      email.includes(searchValue) ||
      department.includes(searchValue)
    );
  });

  // Table columns
  const columns = [
    {
      title: "Employee",
      key: "user",
      render: (_, record) => (
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Avatar
            src={record.profileImage || record.profilePicture}
            icon={
              !record.profileImage && !record.profilePicture && <UserOutlined />
            }
            size={window.innerWidth < 576 ? "small" : "default"}
          />
          <div>
            <div className="font-medium text-sm sm:text-base">
              {`${record.firstName || ""} ${record.lastName || ""}`.trim()}
            </div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
      sorter: (a, b) => {
        const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim();
        const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim();
        return nameA.localeCompare(nameB);
      },
      width: "30%",
      ellipsis: true,
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (department) => department || "-",
      responsive: ["sm", "md", "lg", "xl"], // ไม่แสดงบนมือถือ
      width: "15%",
    },
    {
      title: "Roles",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag
          color={
            role === "SuperAdmin" ? "red" : role === "Admin" ? "green" : "blue"
          }>
          {role}
        </Tag>
      ),
      filters: [
        { text: "User", value: "User" },
        { text: "Admin", value: "Admin" },
        { text: "SuperAdmin", value: "SuperAdmin" },
      ],
      onFilter: (value, record) => record.role === value,
      width: "15%",
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Switch
          checked={record.status !== "inactive"}
          onChange={(checked) =>
            handleStatusChange(
              record._id || record.id,
              checked ? "active" : "inactive"
            )
          }
          checkedChildren="active"
          unCheckedChildren="inactive"
          size={window.innerWidth < 576 ? "small" : "default"}
        />
      ),
      filters: [
        { text: "active", value: "active" },
        { text: "inactive", value: "inactive" },
      ],
      onFilter: (value, record) => (record.status || "active") === value,
      width: "15%",
      responsive: ["xs", "sm", "md", "lg", "xl"], // เปลี่ยนจาก ["sm", "md", "lg", "xl"] เป็น ["xs", "sm", "md", "lg", "xl"] เพื่อให้แสดงในทุกขนาดหน้าจอรวมถึงมือถือ
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        // สร้างรายการเมนูตามบทบาทของผู้ใช้
        const menuItems = [];

        // ลบการแก้ไขผู้ใช้ออก - ไม่รวม item นี้ใน menuItems

        // ตัวเลือกประวัติคำร้องสำหรับ User
        if (record.role === "User") {
          menuItems.push({
            key: "1", // เปลี่ยน key เป็น 1 เพราะไม่มีแก้ไขแล้ว
            icon: <HistoryOutlined />,
            label: "ดูประวัติคำร้อง",
            onClick: () => fetchUserIssues(record),
          });
        }

        // ตัวเลือกคำร้องที่ได้รับมอบหมายสำหรับ Admin และ SuperAdmin
        if (record.role === "Admin" || record.role === "SuperAdmin") {
          menuItems.push({
            key: "1", // เปลี่ยน key เป็น 1 เพราะไม่มีแก้ไขแล้ว
            icon: <SolutionOutlined />,
            label: "รายการคำร้องที่ได้รับมอบหมาย",
            onClick: () => fetchAssignedIssues(record),
          });
        }

        // ตัวเลือกลบสำหรับทุกคน
        menuItems.push({
          key: "2", // เปลี่ยน key เป็น 2 เพราะไม่มีแก้ไขแล้ว
          icon: <DeleteOutlined />,
          label: "ลบ",
          danger: true,
          onClick: () => showDeleteConfirm(record),
        });

        return (
          <Dropdown
            menu={{ items: menuItems }}
            placement="bottomRight"
            trigger={["click"]}>
            <Button
              type="text"
              icon={<EllipsisOutlined style={{ fontSize: "20px" }} />}
              style={{
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </Dropdown>
        );
      },
      width: "10%",
    },
  ];

  return (
    <div className="p-3 sm:p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-lg sm:text-xl font-bold">จัดการผู้ใช้งาน</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto items-start sm:items-center">
          <div className="w-full max-w-md relative flex justify-center items-center gap-2">
            <Input.Search
              placeholder="ค้นหาผู้ใช้งาน..."
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", maxWidth: "300px" }}
              size={window.innerWidth < 576 ? "middle" : "middle"}
            />
            <Button
              type="primary"
              onClick={fetchUsers}
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
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <Spin size="large" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey={(record) => record._id || record.id}
            pagination={{
              pageSize: window.innerWidth < 576 ? 5 : 10,
              responsive: true,
              size: window.innerWidth < 576 ? "small" : "default",
            }}
            locale={{ emptyText: "ไม่พบข้อมูลผู้ใช้งาน" }}
            size={window.innerWidth < 576 ? "small" : "middle"}
            scroll={{ x: "max-content" }}
          />
        </div>
      )}

      {/* เพิ่ม Modal ยืนยันการลบผู้ใช้ */}
      <Modal
        title="ยืนยันการลบผู้ใช้"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmModalVisible(false)}>
            ยกเลิก
          </Button>,
          <Button
            key="delete"
            danger
            onClick={() =>
              handleDeleteUser(
                selectedDeleteUser?._id || selectedDeleteUser?.id
              )
            }>
            ยืนยันการลบ
          </Button>,
        ]}>
        <p>
          คุณต้องการลบผู้ใช้ &quot;{selectedDeleteUser?.firstName}{" "}
          {selectedDeleteUser?.lastName}&quot; ใช่หรือไม่?
        </p>
        <p>การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
      </Modal>

      {/* Modal แสดงประวัติคำร้อง */}
      <Modal
        title={
          <div>
            ประวัติคำร้องของ{" "}
            <span className="font-medium">
              {selectedUserForIssues?.firstName}{" "}
              {selectedUserForIssues?.lastName}
            </span>
          </div>
        }
        open={issuesModalVisible}
        onCancel={() => setIssuesModalVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setIssuesModalVisible(false)}>
            ปิด
          </Button>,
        ]}>
        {loadingIssues ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : userIssues.length === 0 ? (
          <Empty description="ไม่พบประวัติคำร้อง" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={userIssues}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <div className="flex justify-between items-center">
                      <span>{item.topic || item.title || "ไม่ระบุหัวข้อ"}</span>
                      <Tag color={getStatusColor(item.status)}>
                        {getStatusText(item.status)}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        {item.description?.length > 100
                          ? `${item.description.substring(0, 100)}...`
                          : item.description || "ไม่มีคำอธิบาย"}
                      </div>
                      {/* เพิ่มการแสดงเหตุผลการปฏิเสธ */}
                      {(item.status === "rejected" ||
                        item.status === "ถูกปฏิเสธ") &&
                        item.comment && (
                          <div className="mt-1">
                            <div className="text-red-500 text-xs font-medium">
                              เหตุผลที่ถูกปฏิเสธ:
                            </div>
                            <div className="text-xs bg-red-50 p-2 border-l-2 border-red-300 mt-1">
                              {item.comment}
                            </div>
                          </div>
                        )}
                      <div className="flex justify-between text-xs mt-2">
                        <span>
                          วันที่:{" "}
                          {dayjs(item.createdAt || item.date).format(
                            "DD/MM/YYYY"
                          )}
                        </span>
                      </div>
                      {/* เพิ่มข้อมูลผู้รับผิดชอบ */}
                      {item.assignedAdmin && (
                        <div className="text-xs text-gray-500 mt-1">
                          <span>
                            ผู้รับผิดชอบ:{" "}
                            {item.assignedAdmin.firstName
                              ? `${item.assignedAdmin.firstName} ${
                                  item.assignedAdmin.lastName || ""
                                }`
                              : item.assignedAdmin.name || "ไม่ระบุชื่อ"}
                          </span>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
            pagination={{
              pageSize: 5,
              size: "small",
            }}
          />
        )}
      </Modal>

      {/* Modal แสดงรายการคำร้องที่ได้รับมอบหมาย */}
      <Modal
        title={
          <div>
            รายการคำร้องที่ได้รับมอบหมายของ{" "}
            <span className="font-medium">
              {selectedUserForAssignedIssues?.firstName}{" "}
              {selectedUserForAssignedIssues?.lastName}
            </span>
          </div>
        }
        open={assignedIssuesModalVisible}
        onCancel={() => setAssignedIssuesModalVisible(false)}
        width={700}
        footer={[
          <Button
            key="close"
            onClick={() => setAssignedIssuesModalVisible(false)}>
            ปิด
          </Button>,
        ]}>
        {loadingAssignedIssues ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : assignedIssues.length === 0 ? (
          <Empty description="ไม่พบรายการคำร้องที่ได้รับมอบหมาย" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={assignedIssues}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <div className="flex justify-between items-center">
                      <span>{item.topic || item.title || "ไม่ระบุหัวข้อ"}</span>
                      <Tag color={getStatusColor(item.status)}>
                        {getStatusText(item.status)}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        {item.description?.length > 100
                          ? `${item.description.substring(0, 100)}...`
                          : item.description || "ไม่มีคำอธิบาย"}
                      </div>
                      {/* เพิ่มการแสดงเหตุผลการปฏิเสธ */}
                      {(item.status === "rejected" ||
                        item.status === "ถูกปฏิเสธ") &&
                        item.comment && (
                          <div className="mt-1">
                            <div className="text-red-500 text-xs font-medium">
                              เหตุผลที่ถูกปฏิเสธ:
                            </div>
                            <div className="text-xs bg-red-50 p-2 border-l-2 border-red-300 mt-1">
                              {item.comment}
                            </div>
                          </div>
                        )}
                      <div className="flex justify-between text-xs mt-2">
                        <span>
                          วันที่:{" "}
                          {dayjs(item.createdAt || item.date).format(
                            "DD/MM/YYYY"
                          )}
                        </span>
                      </div>
                      {item.userId && (
                        <div className="text-xs text-gray-500 mt-1">
                          <span>
                            ผู้แจ้ง:{" "}
                            {item.userId.firstName
                              ? `${item.userId.firstName} ${
                                  item.userId.lastName || ""
                                }`
                              : item.userId.name || "ไม่ระบุชื่อ"}
                          </span>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
            pagination={{
              pageSize: 5,
              size: "small",
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
