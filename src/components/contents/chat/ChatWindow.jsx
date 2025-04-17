import { useState, useEffect, useRef } from "react";
import {
  Input,
  Button,
  Avatar,
  Spin,
  Empty,
  Tooltip,
  Typography,
  message,
  Dropdown,
  Menu,
  Modal,
  Upload,
  Popover,
  Image,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  PaperClipOutlined,
  FileOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useSocket } from "../../../context/SocketContext";
import { useUser } from "../../../context/UserContext";
import axios from "axios";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../../utils/baseApi";

const { Text } = Typography;

const ChatWindow = ({ chat, isMobile }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { socket, fetchChatMessages, getChatMessages } = useSocket();
  const { user } = useUser();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [filePopoverVisible, setFilePopoverVisible] = useState(false);

  // เลื่อนลงล่างเมื่อมีข้อความใหม่
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ดึงข้อความเมื่อเลือกแชทใหม่
  useEffect(() => {
    const loadMessages = async () => {
      if (!chat || !chat.issueId) return;

      setLoading(true);
      try {
        // ใช้ fetchChatMessages จาก SocketContext แทนการเรียก API โดยตรง
        await fetchChatMessages(chat.issueId, (response) => {
          if (!response.success) {
            console.error("Error fetching messages:", response.error);
            return;
          }

          // แปลงรูปแบบข้อความให้เหมาะกับการแสดงผล
          const formattedMessages = response.data.map((msg) => ({
            id: msg.id || msg._id,
            text: msg.message || msg.text,
            senderId: msg.senderId?._id || msg.senderId?.id || msg.senderId,
            senderName: msg.senderId?.firstName
              ? `${msg.senderId.firstName} ${msg.senderId.lastName || null}`
              : msg.senderName || "ไม่ระบุชื่อ",
            senderRole: msg.senderId?.role || null,
            senderProfileImage: msg.senderId?.profileImage || null,
            createdAt:
              msg.createdAt || msg.timestamp || new Date().toISOString(),
            issueId: chat.issueId,
            fileUrl: msg.fileUrl || msg.file,
            fileName:
              msg.fileName || (msg.fileUrl && msg.fileUrl.split("/").pop()),
            fileType: msg.fileType,
          }));

          setMessages(formattedMessages);
          setLoading(false);
          setTimeout(scrollToBottom, 100);
        });
      } catch (error) {
        console.error("Error loading messages:", error);
        setLoading(false);
      }
    };

    // เข้าร่วมห้องแชทเมื่อเปลี่ยนห้อง
    if (socket && chat?.issueId) {
      socket.emit("joinUserRoom", chat.issueId);
      loadMessages();
      setFileList([]);
    }

    // ออกจากห้องแชทเมื่อ unmount หรือเปลี่ยนห้องใหม่
    return () => {
      if (socket && chat?.issueId) {
        socket.emit("leaveUserRoom", chat.issueId);
      }
    };
  }, [chat, socket, fetchChatMessages]);

  // ติดตามข้อความใหม่จาก chatMessages ในContext
  useEffect(() => {
    if (!chat || !chat.issueId) return;

    // ดึงข้อความของ chat ปัจจุบันจาก context
    const currentMessages = getChatMessages(chat.issueId);

    if (currentMessages && currentMessages.length > 0) {
      // อัพเดต messages state เฉพาะเมื่อมีข้อความใหม่
      setMessages((prevMessages) => {
        // ถ้าจำนวนข้อความไม่เท่ากันหรือข้อความล่าสุดไม่ตรงกัน แสดงว่ามีข้อความใหม่
        if (prevMessages.length !== currentMessages.length) {
          return currentMessages;
        }

        // ตรวจสอบข้อความล่าสุด
        const latestContextMsg = currentMessages[currentMessages.length - 1];
        const latestStateMsg = prevMessages[prevMessages.length - 1];

        if (latestContextMsg.id !== latestStateMsg.id) {
          return currentMessages;
        }

        return prevMessages;
      });
    }
  }, [chat, getChatMessages]);

  // ยังคงรักษา event listener สำหรับ newMessage ไว้เพื่อความเข้ากันได้กับระบบเดิม
  useEffect(() => {
    if (!socket || !chat || !chat.issueId) return;

    // ลบตัวฟังก์ชันที่อาจมีอยู่ก่อนหน้า
    socket.off("newMessage");
    socket.off("messageReceived");

    // สร้างฟังก์ชันแยกเพื่อให้สามารถถอด event listener ได้ถูกต้อง
    const handleNewMessage = (messageData) => {
      // ตรวจสอบว่าข้อความเป็นของแชทนี้หรือไม่
      if (messageData.issueId === chat.issueId) {
        // console.log("Message data received:", messageData);
        // เช็คว่าเป็นข้อความที่เรามีอยู่แล้วหรือไม่ เพื่อป้องกัน duplicate
        setMessages((prevMessages) => {
          // 1. ตรวจสอบ id ที่ตรงกันหรือ tempId ที่อาจตรงกัน
          const isDuplicateById = prevMessages.some(
            (msg) =>
              msg.id === (messageData.id || messageData._id) ||
              (messageData.tempId && msg.id === messageData.tempId)
          );

          if (isDuplicateById) {
            return prevMessages;
          }

          // 2. ตรวจสอบความซ้ำซ้อนของไฟล์หากมีการส่งไฟล์เดียวกัน
          if (messageData.fileUrl) {
            // ตรวจสอบว่าไฟล์นี้เคยส่งไปแล้วหรือไม่ในช่วงเวลาใกล้เคียงกัน (5 วินาที)
            const isDuplicateFile = prevMessages.some((msg) => {
              // เช็คว่า URL ไฟล์เหมือนกัน
              if (msg.fileUrl === messageData.fileUrl) {
                // ถ้ามี fileUploadId ให้เช็คด้วย
                if (messageData.fileUploadId && msg.fileUploadId) {
                  return msg.fileUploadId === messageData.fileUploadId;
                }

                // ถ้าไม่มี fileUploadId ให้เช็คจาก timestamp
                if (messageData._clientTimestamp && msg._clientTimestamp) {
                  // ถ้า timestamp ต่างกันไม่เกิน 5 วินาที ถือว่าเป็นข้อความเดียวกัน
                  return (
                    Math.abs(
                      messageData._clientTimestamp - msg._clientTimestamp
                    ) < 5000
                  );
                }

                return true; // ถือว่าเป็นไฟล์เดียวกันถ้า URL ตรงกัน
              }
              return false;
            });

            if (isDuplicateFile) {
              return prevMessages;
            }
          }

          // แปลงข้อมูล senderId ที่อาจเป็น Object หรือ String
          const senderId =
            typeof messageData.senderId === "object"
              ? messageData.senderId.id || messageData.senderId._id
              : messageData.senderId;

          // แปลงข้อมูลชื่อผู้ส่ง
          const senderName =
            typeof messageData.senderId === "object"
              ? `${messageData.senderId.firstName || ""} ${
                  messageData.senderId.lastName || ""
                }`.trim()
              : messageData.senderName || "ไม่ระบุชื่อ";

          // แปลงข้อมูลรูปโปรไฟล์ - ตรวจสอบทุกแหล่งที่เป็นไปได้
          let senderProfileImage = null;
          if (typeof messageData.senderId === "object") {
            senderProfileImage =
              messageData.senderId.profileImage ||
              messageData.senderId.profilePicture;
          } else {
            senderProfileImage =
              messageData.senderProfileImage ||
              messageData.profileImage ||
              messageData.profilePicture;
          }

          // สร้างข้อความในรูปแบบที่ถูกต้อง
          const formattedMessage = {
            id: messageData.id || messageData._id,
            text: messageData.message || messageData.text,
            senderId,
            senderName,
            senderProfileImage,
            createdAt: messageData.createdAt || new Date().toISOString(),
            issueId: messageData.issueId,
            fileUrl: messageData.fileUrl || messageData.file,
            fileName:
              messageData.fileName ||
              (messageData.fileUrl && messageData.fileUrl.split("/").pop()),
            fileUploadId: messageData.fileUploadId,
            _clientTimestamp: messageData._clientTimestamp,
          };

          // 3. ตรวจสอบว่ามีข้อความชั่วคราว (optimistic) ที่ตรงกันหรือไม่
          const optimisticIndex = prevMessages.findIndex(
            (msg) =>
              msg._isOptimistic &&
              ((msg.text === formattedMessage.text &&
                !formattedMessage.fileUrl) ||
                msg.fileUrl === formattedMessage.fileUrl)
          );

          if (optimisticIndex !== -1) {
            // ถ้ามีการอัพเดตข้อความชั่วคราว ให้แทนที่ด้วยข้อความจริง
            const updatedMessages = [...prevMessages];
            updatedMessages[optimisticIndex] = formattedMessage;
            return updatedMessages;
          }

          // เพิ่มข้อความใหม่
          return [...prevMessages, formattedMessage];
        });

        // เลื่อนลงล่างเมื่อมีข้อความใหม่
        setTimeout(scrollToBottom, 100);
      }
    };

    // เพิ่มตัวฟังก์ชัน event listener
    socket.on("messageReceived", handleNewMessage);

    // Clean up function
    return () => {
      socket.off("messageReceived", handleNewMessage);
    };
  }, [socket, chat]);

  // เลื่อนลงล่างเมื่อมีข้อความใหม่
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ปรับปรุงฟังก์ชันเรียกดูไฟล์แนบ
  const renderFile = (fileUrl, fileName, isSelf) => {
    if (!fileUrl) return null;

    const extension = fileUrl.split(".").pop().toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif"].includes(extension);
    const isPdf = extension === "pdf";

    // กรณีเป็นรูปภาพ - แสดงในหน้าเว็บโดยตรง
    if (isImage) {
      return (
        <div
          className="border rounded overflow-hidden"
          style={{ maxWidth: "300px", display: "inline-block" }}>
          <Image
            src={fileUrl}
            alt={fileName || "Image"}
            style={{ maxHeight: "250px", maxWidth: "100%" }}
          />
        </div>
      );
    }
    // กรณีเป็น PDF - แสดง embed PDF viewer
    else if (isPdf) {
      return (
        <div className="flex flex-col space-y-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center ${
              isSelf ? "text-white" : "text-blue-500"
            }`}>
            <FilePdfOutlined style={{ marginRight: "8px", color: "#ff4d4f" }} />
            <span
              className="underline truncate"
              style={{ maxWidth: isMobile ? "180px" : "300px" }}>
              {fileName || fileUrl.split("/").pop()}
            </span>
          </a>
          <div
            className="border rounded overflow-hidden mt-2"
            style={{ width: "100%", maxWidth: isMobile ? "280px" : "500px" }}>
            <iframe
              src={fileUrl}
              width="100%"
              height={isMobile ? "300px" : "300px"}
              title={fileName || "PDF Document"}
              className="border-0"
            />
          </div>
        </div>
      );
    }
    // กรณีเป็น Word หรือไฟล์อื่นๆ
    else {
      return (
        <div className="flex items-center">
          {getFileIconByType(fileUrl)}
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`ml-2 underline break-all ${
              isSelf ? "text-white" : "text-blue-500"
            }`}>
            {fileName || fileUrl.split("/").pop()}
          </a>
        </div>
      );
    }
  };

  // ฟังก์ชันตรวจสอบประเภทของไฟล์
  const getFileIconByType = (fileUrl) => {
    if (!fileUrl) return <FileOutlined />;

    const extension = fileUrl.split(".").pop().toLowerCase();

    if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
      return <FileImageOutlined />;
    } else if (extension === "pdf") {
      return <FilePdfOutlined style={{ color: "#ff4d4f" }} />;
    } else if (["doc", "docx"].includes(extension)) {
      return <FileWordOutlined style={{ color: "#2b579a" }} />;
    } else if (["xls", "xlsx"].includes(extension)) {
      return <FileExcelOutlined style={{ color: "#217346" }} />;
    }

    return <FileOutlined />;
  };

  // จัดการการเลือกไฟล์
  const handleFileChange = (info) => {
    if (info.fileList.length > 1) {
      info.fileList = [info.fileList[info.fileList.length - 1]]; // เก็บแค่ไฟล์ล่าสุด
    }
    setFileList(info.fileList);
  };

  // เช็คขนาดไฟล์และประเภทก่อนอัปโหลด
  const beforeUpload = (file) => {
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("ไฟล์ต้องมีขนาดไม่เกิน 10MB");
      return Upload.LIST_IGNORE;
    }

    // ตรวจสอบประเภทไฟล์ที่อนุญาต: รูปภาพ, PDF, และ Word
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const isAllowedFileType = allowedTypes.includes(file.type);

    if (!isAllowedFileType) {
      message.error(
        "สามารถอัพโหลดเฉพาะไฟล์รูปภาพ (JPEG/PNG), PDF, หรือ Word (DOC/DOCX) เท่านั้น"
      );
      return Upload.LIST_IGNORE;
    }

    return false; // ป้องกันการอัปโหลดอัตโนมัติ
  };

  // ส่งข้อความใหม่พร้อมไฟล์
  const handleSend = async () => {
    if (
      (!newMessage.trim() && fileList.length === 0) ||
      !chat ||
      !chat.issueId ||
      !socket
    )
      return;

    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const userId = user.id || user._id;

      // สร้าง unique ID สำหรับข้อความชั่วคราวที่มีความเฉพาะมากขึ้น
      const tempId = `temp_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // คัดลอกข้อมูลรูปโปรไฟล์จากข้อมูลผู้ใช้ให้ครบถ้วน
      const userProfileImage = user.profileImage || user.profilePicture || "";

      // เก็บข้อความเฉพาะเมื่อมีการพิมพ์ข้อความจริงๆ
      const messageText = newMessage.trim();
      // ข้อมูลสำหรับ socket
      const messageData = {
        issueId: chat.issueId,
        message: messageText || "", // ส่งเป็นสตริงว่างถ้าไม่มีข้อความ แต่มีไฟล์
        senderId: userId,
        senderName:
          user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        senderProfileImage: userProfileImage,
        createdAt: new Date().toISOString(),
        tempId: tempId,
        _clientTimestamp: Date.now(), // เพิ่มตัวระบุเวลาส่งจากฝั่ง client
      };

      // ล้างฟอร์มทันที - ย้ายขึ้นมาลบฟอร์มก่อนที่จะมีการอัปโหลดไฟล์
      // เพื่อป้องกันการกดส่งซ้ำ
      setNewMessage("");

      let fileUploadResponse = null;

      // ถ้ามีไฟล์
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const file = fileList[0].originFileObj;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("issueId", chat.issueId); // เพิ่ม issueId ใน formData

        try {
          fileUploadResponse = await axios.post(
            `${API_BASE_URL}/upload/chat`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );
          console.log("File uploaded successfully:", fileUploadResponse.data);
          // เพิ่มข้อมูลไฟล์ลงในข้อความที่จะส่งผ่าน socket
          if (fileUploadResponse.data && fileUploadResponse.data.fileUrl) {
            messageData.fileUrl = fileUploadResponse.data.fileUrl;
            messageData.fileName = file.name;
            messageData.fileUploadId =
              fileUploadResponse.data.fileId || `file_${Date.now()}`; // เพิ่ม ID ของไฟล์เพื่อช่วยระบุความซ้ำซ้อน
          }
        } catch (error) {
          console.error(
            "Error uploading file:",
            error.response ? error.response.data : error.message
          );
          message.error("ไม่สามารถอัพโหลดไฟล์ได้ โปรดลองอีกครั้ง");
          // แม้ว่าอัพโหลดไฟล์จะล้มเหลว เราก็ยังส่งข้อความได้
        }
      }

      // ล้างไฟล์หลังจากอัปโหลด หรือหลังจากพยายามอัปโหลดแล้วล้มเหลว
      setFileList([]);

      // แสดงข้อความชั่วคราวในหน้าจอ (optimistic update)
      const optimisticMessage = {
        id: tempId,
        text: messageText, // ใช้ messageText แทน newMessage.trim() เพื่อให้สอดคล้องกับ messageData
        senderId: userId,
        senderName:
          user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        senderProfileImage: userProfileImage,
        createdAt: new Date().toISOString(),
        issueId: chat.issueId,
        fileUrl: messageData.fileUrl,
        fileName: messageData.fileName,
        fileUploadId: messageData.fileUploadId,
        _isOptimistic: true,
        _clientTimestamp: messageData._clientTimestamp,
      };

      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
      // เลื่อนลงล่างทันทีเมื่อแสดงข้อความชั่วคราว
      setTimeout(scrollToBottom, 50);

      // ส่งข้อความผ่าน socket และเพิ่ม console.log เพื่อตรวจสอบ
      console.log("Sending message data:", messageData);
      socket.emit("sendMessage", messageData, (response) => {
        if (response && response.error) {
          console.error("Error sending message:", response.error);
          message.error("ไม่สามารถส่งข้อความได้");

          // ลบข้อความที่ล้มเหลวออก
          setMessages((prevMessages) =>
            prevMessages.filter((msg) => msg.id !== tempId)
          );
        }
      });
    } catch (error) {
      console.error("Error sending message:", error);
      message.error("ไม่สามารถส่งข้อความได้");
    } finally {
      setUploading(false);
    }
  };

  // กด Enter เพื่อส่งข้อความ
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // รูปแบบการแสดงเวลา
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // เพิ่มสถานะสำหรับ Modal ยืนยันการปิดเคส
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);

  // ฟังก์ชันสำหรับแสดง Modal ยืนยันการปิดเคส
  const showCloseIssueModal = () => {
    setIsCloseModalVisible(true);
  };

  // ฟังก์ชันสำหรับปิด Modal
  const handleCancelClose = () => {
    setIsCloseModalVisible(false);
  };

  // ฟังก์ชันสำหรับปิดเคส
  const handleCloseIssue = async () => {
    try {
      if (!chat || !chat.issueId) {
        message.error("ไม่พบข้อมูลคำร้อง");
        return;
      }

      const token = localStorage.getItem("token");

      // ส่งคำขอไปยัง API เพื่อเปลี่ยนสถานะคำร้องเป็น "completed"
      await axios.put(
        `${API_BASE_URL}/reports/edit/${chat.issueId}`, //404
        { status: "completed" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // แสดงข้อความสำเร็จและส่ง socket event หากจำเป็น
      message.success("ปิดคำร้องเรียบร้อยแล้ว");

      // ส่ง socket event เพื่อแจ้งการเปลี่ยนแปลงสถานะคำร้อง
      if (socket && socket.connected) {
        socket.emit("issue_status_changed", {
          issueId: chat.issueId,
          status: "completed",
        });
      }

      // ปิด Modal
      setIsCloseModalVisible(false);

      // รอให้ toast message แสดงสักครู่ แล้วจึงรีเฟรชหน้าเว็บ
      setTimeout(() => {
        window.location.reload();
      }, 1000); // รีเฟรชหลังจากผ่านไป 1 วินาที
    } catch (error) {
      console.error("Error closing issue:", error);
      message.error("ไม่สามารถปิดคำร้องได้ โปรดลองอีกครั้ง");
    }
  };

  // เมนูสำหรับปุ่ม ... ที่มุมขวาบน
  const menu = (
    <Menu>
      <Menu.Item
        key="close"
        onClick={showCloseIssueModal}
        icon={<CheckCircleOutlined />}
        danger>
        ปิดเคสคำร้อง
      </Menu.Item>
    </Menu>
  );

  // ถ้าไม่มีแชทที่เลือก
  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Empty description="เลือกคำร้องเพื่อเริ่มการสนทนา" />
      </div>
    );
  }

  // แสดง Modal รายละเอียด
  return (
    <div className="flex flex-col h-full">
      {/* ส่วนหัวแชท (เพิ่มปุ่ม ... ที่มุมขวาบน) */}
      <div className="flex flex-col p-3 sm:p-4 border-b-gray-400 shadow-md relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar
              src={chat.profileImage}
              icon={!chat.profileImage && <UserOutlined />}
              size={isMobile ? "default" : "large"}
            />
            <div className="ml-3">
              <h3 className="font-medium text-sm sm:text-base">{chat.name}</h3>
              <div className="text-xs text-gray-500">
                {chat.department || "ไม่ระบุแผนก"}
              </div>
            </div>
          </div>

          {/* ปุ่ม ... ที่มุมขวาบน */}
          <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
            <Button
              type="text"
              icon={
                <MoreOutlined
                  style={{ fontSize: isMobile ? "16px" : "20px" }}
                />
              }
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100"
            />
          </Dropdown>
        </div>

        <div className="mt-2 break-words">
          <Text strong className="text-xs sm:text-sm">
            เรื่อง: {chat.topic}
          </Text>
        </div>
      </div>

      {/* ส่วนแสดงข้อความ */}
      <div className="flex-1 p-2 sm:p-4 overflow-y-auto bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spin>
              <div className="p-5">กำลังโหลดข้อความ...</div>
            </Spin>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            ยังไม่มีข้อความในการสนทนานี้
          </div>
        ) : (
          messages.map((message, index) => {
            const isSelf = message.senderId === (user.id || user._id);
            return (
              <div
                key={index}
                className={`flex mb-3 ${
                  isSelf ? "justify-end" : "justify-start"
                }`}>
                {!isSelf && (
                  <Avatar
                    src={message.senderProfileImage}
                    icon={!message.senderProfileImage && <UserOutlined />}
                    size={isMobile ? "small" : "default"}
                    className="mr-2 self-start flex-shrink-0 mt-1"
                  />
                )}
                <div
                  className={`${
                    isSelf ? "text-right" : "text-left"
                  } max-w-[80%]`}>
                  <Tooltip
                    title={
                      <>
                        <div>{message.senderName}</div>
                        <div>{formatTime(message.createdAt)}</div>
                      </>
                    }>
                    <div
                      className={`inline-block rounded-lg py-2 px-3 sm:px-4 break-words text-sm sm:text-base ${
                        isSelf
                          ? "bg-[#262362] text-white"
                          : "bg-white shadow-sm"
                      }`}>
                      {/* แสดงข้อความ (ถ้ามี) */}
                      {message.text && message.text.trim() !== "" && (
                        <div className="mb-2">{message.text}</div>
                      )}

                      {/* แสดงไฟล์แนบ (ถ้ามี) และส่งค่า isSelf เข้าไปด้วย */}
                      {message.fileUrl &&
                        renderFile(message.fileUrl, message.fileName, isSelf)}
                    </div>
                  </Tooltip>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ส่วนส่งข้อความ */}
      <div
        className={`p-2 sm:p-3 border-b-gray-400 shadow-md borer-t ${
          isMobile ? "pb-safe" : ""
        }`}>
        {fileList.length > 0 && (
          <div className="mb-2 bg-gray-50 p-2 rounded  flex items-center justify-between">
            <div className="flex items-center">
              {getFileIconByType(fileList[0].name)}
              <span className="ml-2 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs">
                {fileList[0].name}
              </span>
            </div>
            <Button
              type="text"
              size="small"
              danger
              onClick={() => setFileList([])}>
              ลบ
            </Button>
          </div>
        )}

        <div className="flex">
          <Popover
            content={
              <Upload
                beforeUpload={beforeUpload}
                fileList={fileList}
                onChange={handleFileChange}
                maxCount={1}>
                <Button icon={<PaperClipOutlined />}>เลือกไฟล์</Button>
              </Upload>
            }
            title="แนบไฟล์"
            trigger="click"
            placement={isMobile ? "topRight" : "bottom"}
            open={filePopoverVisible}
            onOpenChange={setFilePopoverVisible}>
            <Button
              icon={<PaperClipOutlined />}
              className="mr-2"
              size={isMobile ? "middle" : "default"}
              onClick={() => setFilePopoverVisible(true)}
            />
          </Popover>

          <Input.TextArea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="พิมพ์ข้อความ..."
            autoSize={{ minRows: 1, maxRows: isMobile ? 3 : 4 }}
            className="flex-1 resize-none"
            disabled={uploading}
          />

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={
              (newMessage.trim() === "" && fileList.length === 0) || uploading
            }
            loading={uploading}
            className="ml-2"
            style={{
              backgroundColor: "#262362",
              borderColor: "#262362",
            }}
            size={isMobile ? "middle" : "default"}
          />
        </div>
        <div
          className={`${
            isMobile ? "mt-0.5 text-2xs" : "mt-1 text-xs"
          } text-gray-500`}>
          สามารถอัพโหลดเฉพาะไฟล์รูปภาพ (JPEG/PNG), PDF, หรือ Word (DOC/DOCX)
          ขนาดไม่เกิน 10MB
        </div>
      </div>

      {/* Modal ยืนยันการปิดเคส - ปรับขนาดตามหน้าจอ */}
      <Modal
        title={<span className="text-red-500">ยืนยันการปิดเคส</span>}
        open={isCloseModalVisible}
        onOk={handleCloseIssue}
        onCancel={handleCancelClose}
        okText="ยืนยันการปิดเคส"
        cancelText="ยกเลิก"
        width={isMobile ? "90%" : 400}
        okButtonProps={{ danger: true }}>
        <p>คุณต้องการปิดเคสคำร้องนี้ใช่หรือไม่?</p>
        <p>
          เมื่อปิดเคสแล้ว คำร้องนี้จะถูกเปลี่ยนสถานะเป็น &ldquo;เสร็จสิ้น&rdquo;
          และจะหายไปจากรายการแชท
        </p>
      </Modal>
    </div>
  );
};

ChatWindow.propTypes = {
  chat: PropTypes.shape({
    issueId: PropTypes.string,
    userId: PropTypes.string,
    name: PropTypes.string,
    department: PropTypes.string,
    topic: PropTypes.string,
    profileImage: PropTypes.string,
  }),
  isMobile: PropTypes.bool,
  onClose: PropTypes.func, // เพิ่ม prop สำหรับการออกจากแชท
};

export default ChatWindow;
