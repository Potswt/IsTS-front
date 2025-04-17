import { useState, useEffect, useLayoutEffect } from "react";
import { Layout, Row, Col, Card, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import UserChatList from "./UserChatList";
import ChatWindowUser from "./ChatWindowUser";
import { useSocket } from "../../../context/SocketContext";

const UserContentMessages = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const { socket } = useSocket();
  const [isMobile, setIsMobile] = useState(false);

  // ตรวจสอบขนาดหน้าจอ
  useLayoutEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 576);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // ฟังก์ชันสำหรับเลือกแชท
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };

  // ฟังก์ชันสำหรับปิดแชท
  const handleCloseChat = () => {
    setSelectedChat(null);
  };

  // ติดตามเหตุการณ์เมื่อมีการเปลี่ยนแปลงสถานะของคำร้อง
  useEffect(() => {
    if (!socket) return;

    const handleIssueStatusChanged = (data) => {
      if (selectedChat && selectedChat.issueId === data.issueId) {
        if (data.status === "completed" || data.status === "rejected") {
          // กรณีคำร้องถูกปิดหรือถูกปฏิเสธ ให้อัพเดทสถานะในแชททันที
          setSelectedChat((prev) => ({ ...prev, status: data.status }));
        } else {
          // อัพเดทสถานะอื่นๆ ตามปกติ
          setSelectedChat((prev) => ({ ...prev, status: data.status }));
        }
      }
    };

    socket.on("issue_status_changed", handleIssueStatusChanged);

    return () => {
      socket.off("issue_status_changed", handleIssueStatusChanged);
    };
  }, [socket, selectedChat]);

  return (
    <Layout style={{ height: "calc(100vh - 150px)" }}>
      <Card
        style={{ height: "100%" }}
        bodyStyle={{ height: "100%", padding: "0" }}>
        {isMobile && selectedChat && (
          <div className="p-2 bg-gray-100 border-b-gray-400 flex items-center">
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              onClick={handleCloseChat}
              className="mr-2"
            />
            <span className="font-medium truncate">{selectedChat.topic}</span>
          </div>
        )}

        <Row
          style={{
            height: isMobile && selectedChat ? "calc(100% - 40px)" : "100%",
          }}>
          {/* คอลัมน์สำหรับรายการแชท */}
          <Col
            xs={24}
            sm={8}
            md={7}
            lg={6}
            style={{
              height: "100%",
              borderRight: "1px solid #f0f0f0",
              overflow: "hidden",
              display: isMobile && selectedChat ? "none" : "block",
            }}>
            <UserChatList
              onSelectChat={handleSelectChat}
              selectedChat={selectedChat}
            />
          </Col>

          {/* คอลัมน์สำหรับหน้าต่างแชท */}
          <Col
            xs={24}
            sm={16}
            md={17}
            lg={18}
            style={{
              height: "100%",
              display: isMobile && !selectedChat ? "none" : "block",
              overflow: "hidden",
            }}>
            <ChatWindowUser
              chat={selectedChat}
              onClose={handleCloseChat}
              isMobile={isMobile}
            />
          </Col>
        </Row>
      </Card>
    </Layout>
  );
};

export default UserContentMessages;