import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Statistic, Spin } from "antd";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/baseApi"; // Import your API base URL from the utils file

const TopCard = () => {
  const [stats, setStats] = useState({
    rejected: 0,
    completed: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // ใช้ API endpoint ที่มีอยู่แล้วจาก reports/admin/all แทน
        const response = await axios.get(`${API_BASE_URL}/reports/admin/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // console.log("Reports data:", response.data);

        // ดึงข้อมูลรายงานทั้งหมด
        let reportsData = [];
        if (response.data && Array.isArray(response.data.data)) {
          reportsData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          reportsData = response.data;
        }

        // คำนวณสถิติจากข้อมูลรายงาน

        const pending = reportsData.filter(
          (report) =>
            report.status === "pending" || report.status === "รอดำเนินการ"
        ).length;
        const rejected = reportsData.filter(
          (report) =>
            report.status === "rejected" || report.status === "ถูกปฏิเสธ"
        ).length;
        const completed = reportsData.filter(
          (report) =>
            report.status === "completed" || report.status === "เสร็จสิ้น"
        ).length;

        setStats({
          rejected,
          completed,
          pending,
        });
      } catch (error) {
        console.error("Error fetching reports for statistics:", error);
        // เก็บค่าเป็น 0 ในกรณีที่เกิดข้อผิดพลาด
        setStats({
          rejected: 0,
          completed: 0,
          pending: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Define icon colors
  const iconColors = {
    rejected: "#ff4d4f",
    completed: "#4e8b2b",
    pending: "#e08b6d",
  };

  // Define card style
  const cardStyle = {
    background: "#ffffff",
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.06)",
    borderRadius: "8px",
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={8}>
        <Card variant={true} style={cardStyle}>
          <Statistic
            title="ถูกปฏิเสธ"
            valueStyle={{
              color: "#333333",
            }}
            prefix={
              <CloseCircleOutlined
                className="bg-red-200 p-1 rounded-xl"
                style={{ color: iconColors.rejected, fontSize: "24px" }}
              />
            }
            value={loading ? <Spin size="small" /> : stats.rejected}
          />
        </Card>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8}>
        <Card variant={true} style={cardStyle}>
          <Statistic
            title="เสร็จสิ้น"
            valueStyle={{
              color: "#333333",
            }}
            prefix={
              <CheckCircleOutlined
                className="bg-green-200 p-1 rounded-xl"
                style={{ color: iconColors.completed, fontSize: "24px" }}
              />
            }
            value={loading ? <Spin size="small" /> : stats.completed}
          />
        </Card>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8}>
        <Card variant={true} style={cardStyle}>
          <Statistic
            title="รอดำเนินการ"
            valueStyle={{
              color: "#333333",
            }}
            prefix={
              <ClockCircleOutlined
                className="bg-orange-200 p-1 rounded-xl"
                style={{ color: iconColors.pending, fontSize: "24px" }}
              />
            }
            value={loading ? <Spin size="small" /> : stats.pending}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default TopCard;
