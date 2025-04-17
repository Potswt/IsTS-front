import { Layout } from "antd";
import { Content } from "antd/es/layout/layout";
import IssuesReport from "../users-components/IssuesReport";
import { useEffect } from "react";
import { message } from "antd";
import { useUser } from "../context/UserContext";
import { getUserDisplayName } from "../utils/userUtils";

const UserHome = () => {
  const { user } = useUser();

  // แสดงข้อความต้อนรับเมื่อเข้าสู่หน้า UserHome
  useEffect(() => {
    if (user && !sessionStorage.getItem("welcomeShown")) {
      const displayName = getUserDisplayName(user);
      message.success(
        <span>
          ยินดีต้อนรับ <b>{displayName}</b>! คุณพร้อมสำหรับการใช้งานระบบ Issue
          Support and Tracking แล้ว
        </span>,
        4
      );
      sessionStorage.setItem("welcomeShown", "true");
    }
  }, [user]);

  return (
    <Layout className=" pt-5 pb-2">
      <Content
        style={{
          padding: 24,
        }}>
        <IssuesReport />
      </Content>
    </Layout>
  );
};

export default UserHome;
