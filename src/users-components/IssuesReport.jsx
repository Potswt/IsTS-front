import { useState, useEffect } from "react";
import {
  Layout,
  Button,
  Input,
  theme,
  message,
  Spin,
  Row,
  Col,
  Tabs,
  Badge,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  LoadingOutlined,
  ReloadOutlined,
  HistoryOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import IssueFormModal from "./IssueFormModal";
import IssueCard from "./IssueCard";
import { Content } from "antd/es/layout/layout";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { API_BASE_URL } from "../utils/baseApi"; // Import your API base URL from the utils file

const IssuesReport = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [issues, setIssues] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState("active"); // เพิ่ม state สำหรับ tab ที่กำลังใช้งาน

  // ใช้ข้อมูลผู้ใช้จาก context
  const { user } = useUser();

  // เรียกข้อมูลคำร้องจาก API เมื่อโหลดคอมโพเนนต์
  useEffect(() => {
    fetchIssues();
  }, []);

  // ดึงข้อมูลคำร้องทั้งหมดของผู้ใช้ปัจจุบัน รวมถึงคำร้องที่ถูกปฏิเสธและเสร็จสิ้นแล้ว
  const fetchIssues = async (isRefreshing = false) => {
    try {
      // ถ้าเป็นการรีเฟรช ให้ set state refreshing แทน loading
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem("token");

      // Add a timeout to prevent long hanging requests
      const response = await axios.get(`${API_BASE_URL}/reports/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // Add a 10 second timeout
      });

      // console.log("Fetched all issues:", response.data);

      // ตรวจสอบรูปแบบการตอบกลับจาก API
      let reportData = [];
      if (response.data && Array.isArray(response.data.data)) {
        reportData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        reportData = response.data;
      } else {
        console.warn("Unexpected API response format:", response.data);
      }

      // เพิ่มการแม็ปค่า rating ที่อาจจะเป็น null ให้เป็น 0
      const processedReportData = reportData.map((report) => ({
        ...report,
        rating: report.rating || null,
      }));

      setIssues(processedReportData);

      // ถ้าเป็นการรีเฟรช แสดงข้อความสำเร็จ
      if (isRefreshing) {
        message.success("รีเฟรชข้อมูลสำเร็จ");
      }
    } catch (error) {
      console.error("Error fetching issues:", error);

      if (error.code === "ERR_NETWORK" || error.message.includes("timeout")) {
        message.error(
          "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ โปรดลองอีกครั้งในภายหลัง"
        );
      } else if (error.response && error.response.status === 404) {
        // API ส่ง 404 เมื่อไม่พบข้อมูล ไม่ถือเป็น error
        setIssues([]);
      } else {
        message.error("ไม่สามารถโหลดข้อมูลคำร้องได้");
        setIssues([]);
      }
    } finally {
      // ปิดสถานะโหลดทั้ง loading และ refreshing
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRatingChange = (issueId, newRating) => {
    // console.log(`Rating changed for issue ${issueId} to ${newRating}`);

    // อัปเดต state เฉพาะหน้าทันที
    setIssues((prevIssues) =>
      prevIssues.map((issue) =>
        issue._id === issueId || issue.issueId === issueId
          ? { ...issue, rating: newRating }
          : issue
      )
    );
  };

  // ฟังก์ชันสำหรับจัดการการคลิกปุ่มรีเฟรช
  const handleRefresh = () => {
    fetchIssues(true);
  };

  // แยกข้อมูลตาม tab
  const getIssuesByStatus = () => {
    if (!issues || !Array.isArray(issues)) {
      return {
        active: [],
        history: [],
      };
    }

    // กรองตามคำค้นหา
    const searchFiltered =
      searchTerm.trim() === ""
        ? issues
        : issues.filter((issue) => {
            const searchLower = searchTerm.toLowerCase();
            return (
              (issue.topic || "").toLowerCase().includes(searchLower) ||
              (issue.description || "").toLowerCase().includes(searchLower)
            );
          });

    // แยกข้อมูลตามสถานะ
    const active = searchFiltered.filter(
      (issue) => !["completed", "rejected"].includes(issue.status)
    );

    const history = searchFiltered.filter((issue) =>
      ["completed", "rejected"].includes(issue.status)
    );

    return { active, history };
  };

  // นับจำนวนคำร้องแต่ละประเภท
  const { active, history } = getIssuesByStatus();

  // จัดการเมื่อเปลี่ยน tab
  const handleTabChange = (key) => {
    setActiveTabKey(key);
  };

  // สร้างรายการ tab
  const items = [
    {
      key: "active",
      label: (
        <span>
          <FileTextOutlined />
          คำร้องที่ดำเนินการอยู่
          <Badge
            count={active.length}
            style={{ marginLeft: "8px", backgroundColor: "#262362" }}
            overflowCount={99}
          />
        </span>
      ),
    },
    {
      key: "history",
      label: (
        <span>
          <HistoryOutlined />
          ประวัติคำร้อง
          <Badge
            count={history.length}
            style={{ marginLeft: "8px", backgroundColor: "#8c8c8c" }}
            overflowCount={99}
          />
        </span>
      ),
    },
  ];

  // ฟังก์ชัน add, edit, delete ยังคงเหมือนเดิม
  const handleAddIssue = () => {
    setEditingIssue(null);
    setIsModalVisible(true);
  };

  const handleEditIssue = (issue) => {
    setEditingIssue(issue);
    setIsModalVisible(true);
  };

  const handleModalOk = async (formData) => {
    try {
      const token = localStorage.getItem("token");

      if (editingIssue) {
        // กรณีแก้ไขคำร้อง
        const issueId =
          editingIssue.issueId || editingIssue._id || editingIssue.id;

        if (!issueId) {
          message.error("ไม่พบ ID ของคำร้องที่ต้องการแก้ไข");
          return;
        }

        await axios.put(`${API_BASE_URL}/reports/edit/${issueId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });

        message.success("แก้ไขคำร้องสำเร็จ");
      } else {
        // กรณีสร้างคำร้องใหม่
        const response = await axios.post(
          `${API_BASE_URL}/reports/create/me`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Create report response:", response.data);
        message.success("สร้างคำร้องสำเร็จ");
        // หลังจากสร้างคำร้อง ให้กลับไปที่ tab คำร้องที่ดำเนินการอยู่
        setActiveTabKey("active");
      }

      // โหลดข้อมูลใหม่หลังจากการเปลี่ยนแปลง
      fetchIssues();

      // เคลียร์ฟอร์มและปิดโมดัล
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error saving report:", error);
      if (error.response?.data?.message) {
        message.error(
          `ไม่สามารถบันทึกคำร้องได้: ${error.response.data.message}`
        );
      } else {
        message.error("ไม่สามารถบันทึกคำร้องได้");
      }
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleDeleteIssue = async (issue) => {
    try {
      const token = localStorage.getItem("token");
      const issueId = issue.issueId || issue._id || issue.id;

      if (!issueId) {
        message.error("ไม่พบ ID ของคำร้อง");
        return;
      }

      await axios.delete(`${API_BASE_URL}/reports/delete/${issueId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // อัพเดตรายการคำร้องโดยลบคำร้องที่มี ID ตรงกัน
      setIssues(
        issues.filter(
          (i) => i.issueId !== issueId && i._id !== issueId && i.id !== issueId
        )
      );

      message.success("ลบคำร้องสำเร็จ");
    } catch (error) {
      console.error("Error deleting report:", error);
      message.error(error.response?.data?.message || "ไม่สามารถลบคำร้องได้");
    }
  };

  // ฟังก์ชันแสดงคำร้องตาม tab ที่เลือก
  const renderIssues = () => {
    const issuesToShow = activeTabKey === "active" ? active : history;

    if (loading) {
      return (
        <div className="flex justify-center items-center py-16">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </div>
      );
    }

    if (issuesToShow.length === 0) {
      return (
        <div className="flex justify-center items-center py-16 text-gray-500">
          {searchTerm
            ? "ไม่พบคำร้องที่ตรงกับคำค้นหา"
            : activeTabKey === "active"
            ? "คุณยังไม่มีคำร้องที่กำลังดำเนินการอยู่ กดปุ่ม 'เพิ่มคำร้อง' เพื่อสร้างคำร้องใหม่"
            : "ไม่พบประวัติคำร้องของคุณ"}
        </div>
      );
    }

    return (
      <Row gutter={[16, 16]}>
        {issuesToShow.map((issue, index) => (
          <Col
            xs={24}
            sm={24}
            md={12}
            lg={8}
            xl={8}
            key={issue._id || issue.issueId || issue.id || `issue-${index}`}>
            <IssueCard
              issue={issue}
              // ส่ง onEdit เฉพาะสำหรับคำร้องที่อยู่ใน tab active เท่านั้น
              onEdit={activeTabKey === "active" ? handleEditIssue : null}
              // ส่ง onDelete สำหรับทั้งสองแท็บ เพื่อให้ลบได้ในทั้งสองแท็บ
              onDelete={handleDeleteIssue}
              // กำหนด readOnly ให้เป็นจริงเฉพาะเมื่ออยู่ในแท็บ history
              readOnly={activeTabKey === "history"}
              onRatingChange={handleRatingChange}
            />
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <Layout>
      <Content
        className="rounded-lg"
        style={{
          minHeight: "75vh",
          margin: "3px 10px",
          padding: window.innerWidth < 768 ? 12 : 24,
          borderRadius: borderRadiusLG,
          background: colorBgContainer,
          overflowY: "auto",
        }}>
        <div className="sticky top-0 bg-white z-30 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h2 className="text-xl font-medium">คำร้องของฉัน</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
              <Input
                placeholder="ค้นหาคำร้อง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: window.innerWidth < 768 ? "100%" : "300px",
                }}
                prefix={<SearchOutlined />}
              />

              {/* กลุ่มปุ่ม - แสดงในแถวเดียวกันเสมอ */}
              <div className="flex gap-2 self-end sm:self-auto">
                {/* ปุ่มรีเฟรช */}
                <Button
                  type="primary"
                  onClick={handleRefresh}
                  loading={refreshing}
                  style={{
                    backgroundColor: "#262362",
                    transition: "background-color 0.3s",
                    border: "none",
                    borderRadius: "50%",
                    height: "32px",
                    width: "32px",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#193CB8")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "#262362")
                  }
                  title="รีเฟรชข้อมูล">
                  <ReloadOutlined />
                </Button>

                {/* แสดงปุ่มเพิ่มคำร้องเฉพาะใน tab คำร้องที่กำลังดำเนินการ */}
                {activeTabKey === "active" && (
                  <Button
                    type="primary"
                    onClick={handleAddIssue}
                    icon={<PlusOutlined />}
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
                    {window.innerWidth < 768 ? "" : "เพิ่มคำร้อง"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* เพิ่ม Tabs สำหรับแยกประเภทคำร้อง */}
          <Tabs
            activeKey={activeTabKey}
            items={items}
            onChange={handleTabChange}
            style={{ marginTop: window.innerWidth < 768 ? "8px" : "16px" }}
            type="card"
            size={window.innerWidth < 768 ? "small" : "default"}
          />
        </div>

        {/* แสดงคำร้องตาม tab ที่เลือก */}
        {renderIssues()}

        <IssueFormModal
          visible={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          editingRecord={editingIssue}
          key={editingIssue ? editingIssue._id || editingIssue.id : "new"}
          userData={user}
        />
      </Content>
    </Layout>
  );
};

export default IssuesReport;
