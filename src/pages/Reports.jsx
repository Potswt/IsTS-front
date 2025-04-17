import { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Table,
  Select,
  Input,
  Button,
  Tag,
  Typography,
  Avatar,
  Space,
  Spin,
  message,
  Modal,
  Divider,
  Image,
  Rate,
} from "antd";
import {
  UserOutlined,
  ReloadOutlined,
  SearchOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileOutlined,
  FileWordOutlined,
  DownloadOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import ExportButton from "../components/export/ExportButton";
import { API_BASE_URL } from "../utils/baseApi"; // Import your API base URL from the utils file

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;


const Reports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_BASE_URL}/reports/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // console.log("All reports response:", response.data);

      let reportsData = [];
      if (response.data && Array.isArray(response.data.data)) {
        reportsData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        reportsData = response.data;
      } else {
        console.warn("Unexpected API response format:", response.data);
      }

      const completedReports = reportsData.filter(
        (report) =>
          report.status === "completed" || report.status === "rejected"
      );

      const formattedReports = completedReports.map((report, index) => ({
        key: report._id || report.issueId || index,
        id: report._id || report.issueId,
        title: report.topic || report.title || `Issue ${index}`,
        description: report.description || "ไม่มีคำอธิบาย",
        status: report.status || "unknown",
        date: report.date || report.createdAt || new Date(),
        comment: report.comment,
        submitter: report.userId
          ? {
              name:
                report.userId.firstName && report.userId.lastName
                  ? `${report.userId.firstName} ${report.userId.lastName}`
                  : report.userId.name || "ไม่ระบุชื่อ",
              department: report.userId.department || "ไม่ระบุแผนก",
              profileImage:
                report.userId.profileImage || report.userId.profilePicture,
              email: report.userId.email || null,
            }
          : {
              name: "ไม่ระบุชื่อ",
              department: "ไม่ระบุแผนก",
              profileImage: null,
              email: null,
            },
        assignedAdmin: report.assignedAdmin
          ? {
              name:
                report.assignedAdmin.firstName && report.assignedAdmin.lastName
                  ? `${report.assignedAdmin.firstName} ${report.assignedAdmin.lastName}`
                  : report.assignedAdmin.name || "ไม่ระบุชื่อ",
              role: report.assignedAdmin.role || "Admin",
              profileImage:
                report.assignedAdmin.profileImage ||
                report.assignedAdmin.profilePicture,
            }
          : null,
        file: report.file || null,
        rating: report.rating || null,
      }));

      setReports(formattedReports);
      setFilteredReports(formattedReports);
      // console.log("Formatted reports:", formattedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      message.error("ไม่สามารถดึงข้อมูลรายงานได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let result = [...reports];

    if (statusFilter !== "all") {
      result = result.filter((report) => report.status === statusFilter);
    }

    if (dateFilter !== "all") {
      const today = dayjs();
      let startDate;

      if (dateFilter === "daily") {
        startDate = today.startOf("day");
      } else if (dateFilter === "weekly") {
        startDate = today.subtract(7, "day");
      } else if (dateFilter === "monthly") {
        startDate = today.subtract(30, "day");
      } else if (dateFilter === "yearly") {
        startDate = today.subtract(365, "day");
      }

      if (startDate) {
        result = result.filter((report) => {
          const reportDate = dayjs(report.date);
          return (
            reportDate.isAfter(startDate) || reportDate.isSame(startDate, "day")
          );
        });
      }
    }

    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      result = result.filter(
        (report) =>
          report.title.toLowerCase().includes(lowerCaseSearch) ||
          report.description.toLowerCase().includes(lowerCaseSearch) ||
          report.submitter.name.toLowerCase().includes(lowerCaseSearch) ||
          report.submitter.department.toLowerCase().includes(lowerCaseSearch) ||
          (report.assignedAdmin?.name &&
            report.assignedAdmin.name.toLowerCase().includes(lowerCaseSearch))
      );
    }

    setFilteredReports(result);
  }, [reports, statusFilter, searchText, dateFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getDateRangeText = () => {
    switch (dateFilter) {
      case "daily":
        return "รายวัน";
      case "weekly":
        return "รายสัปดาห์";
      case "monthly":
        return "รายเดือน";
      case "yearly":
        return "รายปี";
      default:
        return "";
    }
  };

  const columns = [
    {
      title: "Issue",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500 mt-1 line-clamp-1">
            {record.description}
          </div>
        </div>
      ),
    },
    {
      title: "Submitter",
      dataIndex: "submitter",
      key: "submitter",
      render: (submitter) => (
        <Space>
          <Avatar
            src={submitter.profileImage}
            icon={!submitter.profileImage && <UserOutlined />}
          />
          <div>
            <div>{submitter.name}</div>
            <div className="text-xs text-gray-500">{submitter.department}</div>
          </div>
        </Space>
      ),
      responsive: ["md"],
    },
    {
      title: "Assigned Admin",
      dataIndex: "assignedAdmin",
      key: "assignedAdmin",
      render: (admin) =>
        admin ? (
          <Space>
            <Avatar
              src={admin.profileImage}
              icon={!admin.profileImage && <UserOutlined />}
            />
            <div>
              <div>{admin.name}</div>
              <div className="text-xs text-gray-500">{admin.role}</div>
            </div>
          </Space>
        ) : (
          <Text type="secondary">ไม่มีผู้รับผิดชอบ</Text>
        ),
      responsive: ["lg"],
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      responsive: ["sm"],
      sorter: (a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      },
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        let text = "ไม่ทราบสถานะ";

        if (status === "completed") {
          color = "green";
          text = "เสร็จสิ้น";
        } else if (status === "rejected") {
          color = "red";
          text = "ถูกปฏิเสธ";
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Ratings",
      dataIndex: "rating",
      key: "rating",
      render: (rating) =>
        rating ? (
          <Rate disabled defaultValue={rating} allowHalf />
        ) : (
          <span className="text-gray-400">ยังไม่มีคะแนน</span>
        ),
      responsive: ["sm", "md", "lg", "xl"],
      sorter: (a, b) => (a.rating || null) - (b.rating || null),
    },
    {
      title: "Details",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<FileTextOutlined />}
          onClick={() => showReportDetail(record)}
          style={{
            backgroundColor: "#262362",
            color: "#fff",
            transition: "background-color 0.3s",
            border: "none",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#193CB8")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#262362")}>
          ดูรายละเอียด
        </Button>
      ),
    },
  ];

  const showReportDetail = (report) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

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

  const renderAttachment = (fileUrl) => {
    if (!fileUrl) return null;

    const fileType = getFileType(fileUrl);
    const fileName = fileUrl.split("/").pop();

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
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-500 hover:underline mt-2">
            {fileType === "pdf" && (
              <FilePdfOutlined style={{ color: "#ff4d4f" }} />
            )}
            {fileType === "word" && (
              <FileWordOutlined style={{ color: "#2b579a" }} />
            )}
            {fileType === "other" && <FileOutlined />}
            <span className="ml-2 break-all">{fileName}</span>
            <DownloadOutlined className="ml-2" />
          </a>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <Content
        style={{
          margin: "24px 16px",
          padding: 24,
          background: "#fff",
          borderRadius: "8px",
        }}>
        <div className="flex justify-between items-center mb-6">
          <Title level={4}>รายงานคำร้อง</Title>
          <div className="flex gap-2">
            <ExportButton
              data={filteredReports}
              filename="รายงานคำร้อง"
              dateRange={getDateRangeText()}
            />
            <Button
              onClick={fetchReports}
              loading={loading}
              style={{
                backgroundColor: "#262362",
                color: "#fff",
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

        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="ค้นหารายงาน..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ maxWidth: 300 }}
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-gray-400">
                เลือกสถานะ :
              </span>
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                style={{ width: 150 }}
                placeholder="สถานะ">
                <Option value="all">สถานะทั้งหมด</Option>
                <Option value="completed">เสร็จสิ้น</Option>
                <Option value="rejected">ถูกปฏิเสธ</Option>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-gray-400">
                เลือกช่วงเวลา :
              </span>
              <Select
                value={dateFilter}
                onChange={(value) => setDateFilter(value)}
                style={{ width: 150 }}
                placeholder="ช่วงเวลา"
                suffixIcon={<CalendarOutlined />}>
                <Option value="all">ทั้งหมด</Option>
                <Option value="daily">รายวัน</Option>
                <Option value="weekly">รายสัปดาห์</Option>
                <Option value="monthly">รายเดือน</Option>
                <Option value="yearly">รายปี</Option>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <Spin size="large" />
            <div className="mt-2">กำลังโหลดรายงาน...</div>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredReports}
            pagination={{ pageSize: 10 }}
            rowKey="id"
            scroll={{ x: "max-content" }}
          />
        )}

        <Modal
          title={<span className="font-semibold">{selectedReport?.title}</span>}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              ปิด
            </Button>,
          ]}
          width={700}>
          {selectedReport && (
            <>
              <Divider style={{ margin: "16px 0" }} />

              <div className="mb-4">
                <h4 className="mb-2 font-semibold">สถานะ</h4>
                <Tag
                  color={
                    selectedReport.status === "completed" ? "green" : "red"
                  }>
                  {selectedReport.status === "completed"
                    ? "เสร็จสิ้น"
                    : "ถูกปฏิเสธ"}
                </Tag>

                {selectedReport.status === "rejected" &&
                  selectedReport.comment && (
                    <div className="mt-3">
                      <div className="text-red-500 font-medium">
                        เหตุผลที่ถูกปฏิเสธ:
                      </div>
                      <div className="mt-1 text-gray-700 bg-red-50 p-3 rounded border-l-2 border-red-300">
                        {selectedReport.comment}
                      </div>
                    </div>
                  )}
              </div>

              <Divider style={{ margin: "16px 0" }} />

              <div className="mb-4">
                <h4 className="mb-2 font-semibold">รายละเอียด</h4>
                <p>{selectedReport.description}</p>
              </div>

              <Divider style={{ margin: "16px 0" }} />

              <div className="mb-4">
                <h4 className="mb-2 font-semibold">ผู้แจ้ง</h4>
                <Space align="start">
                  <Avatar
                    src={selectedReport.submitter.profileImage}
                    icon={
                      !selectedReport.submitter.profileImage && <UserOutlined />
                    }
                    size={64}
                  />
                  <div>
                    <div className="font-medium">
                      {selectedReport.submitter.name}
                    </div>
                    <div className="text-gray-500">
                      {selectedReport.submitter.department}
                    </div>
                    {selectedReport.submitter.email && (
                      <div className="text-gray-500">
                        {selectedReport.submitter.email}
                      </div>
                    )}
                  </div>
                </Space>
              </div>

              {selectedReport.assignedAdmin && (
                <>
                  <Divider style={{ margin: "16px 0" }} />
                  <div className="mb-4">
                    <h4 className="mb-2 font-semibold">ผู้รับผิดชอบ</h4>
                    <Space align="start">
                      <Avatar
                        src={selectedReport.assignedAdmin.profileImage}
                        icon={
                          !selectedReport.assignedAdmin.profileImage && (
                            <UserOutlined />
                          )
                        }
                        size={64}
                      />
                      <div>
                        <div className="font-medium">
                          {selectedReport.assignedAdmin.name}
                        </div>
                        <div className="text-gray-500">
                          {selectedReport.assignedAdmin.role}
                        </div>
                      </div>
                    </Space>
                  </div>
                </>
              )}

              <Divider style={{ margin: "16px 0" }} />

              <div className="mb-4">
                <h4 className="mb-2 font-semibold">วันที่แจ้งปัญหา</h4>
                <p>{dayjs(selectedReport.date).format("DD/MM/YYYY")}</p>
              </div>

              <Divider style={{ margin: "16px 0" }} />

              <div className="mb-4">
                <h4 className="mb-2 font-semibold">คะแนนรีวิว</h4>
                {selectedReport.rating > null ? (
                  <Rate
                    disabled
                    defaultValue={selectedReport.rating}
                    allowHalf
                  />
                ) : (
                  <span className="text-gray-400">ยังไม่มีคะแนน</span>
                )}
              </div>

              {selectedReport.file && (
                <>
                  <Divider style={{ margin: "16px 0" }} />
                  {renderAttachment(selectedReport.file)}
                </>
              )}
            </>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default Reports;
