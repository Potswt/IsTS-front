import { useState, useEffect, useCallback } from "react";
import { Avatar, Badge, Spin, Empty, Input, List, Button, message } from "antd";
import {
  UserOutlined,
  PaperClipOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useSocket } from "../../../context/SocketContext";
import { useUser } from "../../../context/UserContext";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../../utils/baseApi";
const { Search } = Input;

// Import message component สำหรับการแสดงข้อความแจ้งเตือน
import { message as antMessage } from "antd";

// ฟังก์ชันสำหรับเล่นเสียงแจ้งเตือน
const playNotificationSound = () => {
  const audio = new Audio("/notification.mp3");
  audio
    .play()
    .catch((error) => console.log("Error playing notification sound:", error));
};

const ChatList = ({ onSelectChat, selectedChat }) => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(null);
  const [refreshing, setRefreshing] = useState(false); // เพิ่ม state สำหรับการรีเฟรช
  const { socket } = useSocket();
  const { user } = useUser(); // เพิ่มการใช้งาน user context

  // แปลง fetchAssignedIssues เป็น useCallback เพื่อให้สามารถเรียกใช้ได้ในฟังก์ชันอื่น
  const fetchAssignedIssues = useCallback(
    async (isRefreshing = false) => {
      try {
        if (isRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const token = localStorage.getItem("token");
        const userId = user?.id || user?._id;

        if (!userId) {
          console.error("User ID is missing");
          setLoading(false);
          setRefreshing(false);
          return;
        }

        if (!token) {
          console.error("No token found, please log in again");
          antMessage.error("กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
          setLoading(false);
          setRefreshing(false);
          return;
        }

        // ดึงคำร้องที่ถูกมอบหมายให้กับ Admin/SuperAdmin นี้
        const response = await axios.get(
          `${API_BASE_URL}/reports/admin/assigned/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // console.log("Assigned issues response:", response.data);

        // แปลงข้อมูลจาก API เป็นรูปแบบ contacts
        let assignedIssues = [];
        if (response.data?.data && Array.isArray(response.data.data)) {
          assignedIssues = response.data.data;
        } else if (Array.isArray(response.data)) {
          assignedIssues = response.data;
        }

        // กรองเอาเฉพาะรายการที่ไม่ได้มีสถานะ "completed" หรือ "rejected"
        assignedIssues = assignedIssues.filter(
          (issue) => issue.status !== "completed" && issue.status !== "rejected"
        );

        // ดึงข้อมูลการแชทเพื่อตรวจสอบข้อความที่ยังไม่ได้อ่าน
        const chatCountsPromises = assignedIssues.map(async (issue) => {
          try {
            const issueId = issue._id || issue.issueId;

            // แก้ไข endpoint ให้ถูกต้อง
            const chatResponse = await axios.get(
              `${API_BASE_URL}/reports/chat/${issueId}/unread-count`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            // console.log(
            //   `Chat response for issue ${issueId}:`,
            //   chatResponse.data
            // );

            return {
              issueId,
              unreadCount: chatResponse.data?.data?.unreadCount || 0,
              lastMessage: chatResponse.data?.data?.lastMessage || null,
            };
          } catch (error) {
            console.error(
              `Error fetching chat counts for issue ${
                issue._id || issue.issueId
              }:`,
              error.response?.data || error.message
            );
            return {
              issueId: issue._id || issue.issueId,
              unreadCount: 0,
              lastMessage: null,
            };
          }
        });

        // รอผลลัพธ์จากการดึงข้อมูลการแชททุกคำร้อง
        const chatCounts = await Promise.all(chatCountsPromises);

        // แปลงคำร้องเป็นรายการผู้ติดต่อพร้อมข้อมูลการแชท
        const contactsList = assignedIssues.map((issue) => {
          const chatInfo = chatCounts.find(
            (chat) => chat.issueId === (issue._id || issue.issueId)
          ) || { unreadCount: 0, lastMessage: null };

          return {
            issueId: issue._id || issue.issueId,
            userId: issue.userId?._id || issue.userId,
            name: issue.userId?.firstName
              ? `${issue.userId.firstName} ${issue.userId.lastName || null}`
              : issue.userId?.name || "ไม่ระบุชื่อ",
            department: issue.userId?.department || "ไม่ระบุแผนก",
            profileImage:
              issue.userId?.profileImage || issue.userId?.profilePicture,
            topic: issue.topic || issue.title || "ไม่มีหัวข้อ",
            lastActive: issue.updatedAt || issue.createdAt,
            unreadCount: chatInfo.unreadCount || 0,
            lastMessage: chatInfo.lastMessage?.message || null,
            lastMessageTime: chatInfo.lastMessage?.createdAt || null,
          };
        });

        // console.log("Transformed contacts:", contactsList);
        setContacts(contactsList);
        setFilteredContacts(contactsList);

        // จบการโหลดข้อมูลและแสดงข้อความสำเร็จถ้าเป็นการรีเฟรช
        if (isRefreshing) {
          antMessage.success("รีเฟรชข้อมูลสำเร็จ");
        }
      } catch (error) {
        console.error(
          "Error fetching assigned issues:",
          error.response?.data || error.message
        );
        message.error("คุณยังไม่มีแชทคำร้อง");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  // ดึงรายการคำร้องที่ถูกมอบหมายเมื่อ component mount
  useEffect(() => {
    fetchAssignedIssues();
  }, [fetchAssignedIssues]);

  // ติดตามข้อความใหม่จาก socket
  useEffect(() => {
    if (!socket) return;

    // เปลี่ยนชื่อ event จาก "new_message" เป็น "newMessage" ตาม backend
    socket.on("newMessage", (messageData) => {
      console.log("New message received:", messageData);

      // ตรวจสอบว่าข้อความมาจากผู้ใช้ปัจจุบันหรือไม่
      const isOwnMessage = messageData.senderId === (user?.id || user?._id);

      // อัพเดต state contacts เพื่อแสดงข้อความล่าสุดและการแจ้งเตือน
      setContacts((prev) =>
        prev.map((contact) => {
          if (contact.issueId === messageData.issueId) {
            // เพิ่มการตรวจสอบว่าเป็นข้อความหรือไฟล์
            const lastMessage = messageData.fileUrl
              ? `📎 ${messageData.fileName || "ไฟล์แนบ"}`
              : messageData.message;

            if (isOwnMessage) {
              // ถ้าเป็นข้อความของเรา อัพเดตข้อความล่าสุด (ถ้าเราอยากให้แสดง) แต่ไม่เพิ่ม unreadCount
              return {
                ...contact,
                // ถ้าต้องการไม่ให้แสดงข้อความของตัวเองเป็นข้อความล่าสุด ให้เอา 2 บรรทัดนี้ออก
                // lastMessage,
                // lastMessageTime: messageData.createdAt || new Date().toISOString(),
              };
            } else {
              // ถ้าเป็นข้อความจากคนอื่น อัพเดตข้อความล่าสุดและเพิ่ม unreadCount
              return {
                ...contact,
                lastMessage,
                lastMessageTime:
                  messageData.createdAt || new Date().toISOString(),
                unreadCount:
                  selectedChat?.issueId !== messageData.issueId
                    ? (contact.unreadCount || 0) + 1
                    : 0,
              };
            }
          }
          return contact;
        })
      );

      // เล่นเสียงแจ้งเตือนเฉพาะเมื่อเป็นข้อความจากคู่สนทนา และไม่ได้กำลังดูแชทนั้นอยู่
      if (!isOwnMessage && selectedChat?.issueId !== messageData.issueId) {
        playNotificationSound();
      }
    });

    // เพิ่มการติดตามเมื่อมีการเปลี่ยนแปลงสถานะคำร้อง
    socket.on("issue_status_changed", (data) => {
      if (data.status === "completed" || data.status === "rejected") {
        // ลบคำร้องที่ถูกปิดหรือถูกปฏิเสธออกจากรายการ
        setContacts((prev) =>
          prev.filter((contact) => contact.issueId !== data.issueId)
        );
        setFilteredContacts((prev) =>
          prev.filter((contact) => contact.issueId !== data.issueId)
        );

        // ถ้ากำลังดูแชทที่ถูกปิดอยู่ ให้แสดงข้อความแจ้งเตือน
        if (selectedChat?.issueId === data.issueId) {
          antMessage.info(
            data.status === "completed"
              ? "คำร้องนี้ได้รับการแก้ไขเรียบร้อยแล้ว"
              : "คำร้องนี้ถูกปฏิเสธ"
          );
        }
      }
    });

    return () => {
      socket.off("newMessage"); // เปลี่ยนชื่อ event ที่ unsubscribe ด้วย
      socket.off("issue_status_changed");
    };
  }, [socket, selectedChat, user]);

  // ฟังก์ชันค้นหาผู้ติดต่อ
  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(
      (contact) =>
        (contact.name?.toLowerCase() || null).includes(value.toLowerCase()) ||
        (contact.department?.toLowerCase() || null).includes(
          value.toLowerCase()
        ) ||
        (contact.topic?.toLowerCase() || null).includes(value.toLowerCase())
    );
    setFilteredContacts(filtered);
  };

  // การเลือกแชท
  const handleSelectChat = (contact) => {
    // อัพเดตสถานะการอ่าน
    setContacts((prev) =>
      prev.map((c) =>
        c.issueId === contact.issueId ? { ...c, unreadCount: 0 } : c
      )
    );

    // อัพเดต filteredContacts ด้วยเพื่อให้ Badge หายไปทันที
    setFilteredContacts((prev) =>
      prev.map((c) =>
        c.issueId === contact.issueId ? { ...c, unreadCount: 0 } : c
      )
    );

    // ส่งข้อมูลไปบอก server ว่าได้อ่านข้อความแล้ว
    markAsRead(contact.issueId);

    // แจ้งคอมโพเนนต์หลัก
    onSelectChat(contact);
  };

  // เพิ่มฟังก์ชันแจ้ง server ว่าได้อ่านข้อความแล้ว
  const markAsRead = async (issueId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      // เรียก API เพื่อทำเครื่องหมายว่าอ่านแล้ว
      await axios.post(
        `${API_BASE_URL}/reports/chat/${issueId}/mark-read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // console.log(`Marked messages as read for issue ${issueId}`);
    } catch (error) {
      console.error(
        `Error marking messages as read for issue ${issueId}:`,
        error
      );
    }
  };

  // เพิ่มฟังก์ชันสำหรับการรีเฟรชรายการแชท
  const handleRefresh = () => {
    fetchAssignedIssues(true);
  };

  // ปรับปรุงการแสดงข้อความสุดท้าย
  const renderLastMessage = (contact) => {
    if (!contact.lastMessage) return null;

    // ตรวจสอบว่าเป็นข้อความไฟล์แนบหรือไม่
    if (contact.lastMessage.startsWith("📎")) {
      return (
        <div className="text-xs text-blue-600 truncate">
          <PaperClipOutlined /> {contact.lastMessage.substring(2)}
        </div>
      );
    }

    return (
      <div className="text-xs text-gray-600 truncate">
        {contact.lastMessage}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spin size="large">
          <div className="content" style={{ padding: "50px" }} />
        </Spin>
      </div>
    );
  }

  return (
    <div className="chat-list-container h-full flex flex-col">
      {/* ส่วนค้นหา - เพิ่มปุ่ม Refresh */}
      <div className="p-3 border-b-gray-300 border-b">
        <div className="flex gap-2">
          <Search
            placeholder="ค้นหาชื่อ หรือแผนก..."
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            onSearch={handleSearch}
            className="flex-1"
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={refreshing}
            onClick={handleRefresh}
            style={{
              backgroundColor: "#262362",
              transition: "background-color 0.3s",
              border: "none",
              borderRadius: "50%",
              height: "32px",
              width: "32px",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#193CB8")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#262362")}
          />
        </div>
      </div>

      {/* รายการผู้ติดต่อ */}
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Spin tip="กำลังโหลดรายการ..." />
        </div>
      ) : filteredContacts.length === 0 ? (
        <Empty
          description={
            searchText
              ? "ไม่พบคำร้องที่ตรงกับการค้นหา"
              : "ไม่มีคำร้องที่ถูกมอบหมาย"
          }
          className="my-10"
        />
      ) : (
        <List
          className="overflow-auto flex-1"
          dataSource={filteredContacts}
          renderItem={(contact) => (
            <List.Item
              className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                selectedChat?.issueId === contact.issueId ? "bg-blue-50" : null
              }`}
              onClick={() => handleSelectChat(contact)}>
              <List.Item.Meta
                className="p-2"
                avatar={
                  <Badge
                    count={contact.unreadCount || 0}
                    dot={false}
                    overflowCount={99}>
                    <Avatar
                      src={contact.profileImage}
                      icon={!contact.profileImage && <UserOutlined />}
                      size="large"
                    />
                  </Badge>
                }
                title={
                  <div className="flex justify-between">
                    <span className="font-medium">{contact.name}</span>
                    {contact.lastActive && (
                      <span className="text-xs text-gray-400">
                        {new Date(contact.lastActive).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                }
                description={
                  <div>
                    <div className="text-sm text-gray-500 truncate">
                      {contact.department}
                    </div>
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {contact.topic}
                    </div>
                    {contact.lastMessage && renderLastMessage(contact)}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

// PropTypes
ChatList.propTypes = {
  onSelectChat: PropTypes.func.isRequired,
  selectedChat: PropTypes.shape({
    issueId: PropTypes.string,
    userId: PropTypes.string,
    name: PropTypes.string,
    department: PropTypes.string,
    topic: PropTypes.string,
    profileImage: PropTypes.string,
  }),
};

export default ChatList;
