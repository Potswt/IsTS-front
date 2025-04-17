import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Dropdown,
  List,
  Avatar,
  Button,
  Empty,
  Tooltip,
  Divider,
  Popconfirm,
} from "antd";
import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useUser } from "../context/UserContext";

const NotiFications = () => {
  const {
    notifications,
    removeNotification,
    markAllAsRead,
    clearAllNotifications,
  } = useSocket();
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  // ตรวจสอบและอัปเดตจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setUnreadCount(
        notifications.filter((notification) => !notification.read).length
      );
    } else {
      setUnreadCount(0);
    }
  }, [notifications]);

  // กรองแสดงเฉพาะการแจ้งเตือนที่เกี่ยวข้องกับผู้ใช้
  const userNotifications = notifications.filter((notification) => {
    // ถ้าผู้ใช้เป็น user ปกติให้แสดงเฉพาะการแจ้งเตือนที่ส่งถึงเขาเท่านั้น
    if (user?.role === "User") {
      return (
        notification.userId === user.id || notification.userId === user._id
      );
    }
    // ถ้าเป็นแอดมินให้เห็นการแจ้งเตือนทั้งหมด
    return true;
  });

  const handleClearNotifications = () => {
    markAllAsRead();
  };

  const handleMenuClick = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  // เพิ่มฟังก์ชันสำหรับลบการแจ้งเตือนทั้งหมด
  const handleDeleteAllNotifications = () => {
    clearAllNotifications();
  };

  // ฟังก์ชันจัดรูปแบบเวลา
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  };

  // สร้างรายการการแจ้งเตือนสำหรับแสดงใน Dropdown
  const notificationItems = (
    <div
      className="shadow-md"
      style={{
        padding: "10px",
        width: "300px",
        maxHeight: "400px",
        overflow: "auto",
        backgroundColor: "white",
        borderRadius: "5px",
      }}>
      {userNotifications && userNotifications.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={userNotifications}
          renderItem={(item) => (
            <List.Item
              className={!item.read ? "bg-blue-50" : ""}
              actions={[
                <Button
                  key="delete"
                  type="text"
                  size="small"
                  danger
                  onClick={() => removeNotification(item.id)}>
                  ลบ
                </Button>,
              ]}>
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{ backgroundColor: getNotificationColor(item.type) }}
                    icon={getNotificationIcon(item.type)}
                  />
                }
                title={<span>{item.message}</span>}
                description={
                  <Tooltip
                    title={new Date(item.createdAt).toLocaleString("th-TH")}>
                    {formatTime(item.createdAt)}
                  </Tooltip>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty
          description="ไม่มีการแจ้งเตือน"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: "20px" }}
        />
      )}
      {userNotifications && userNotifications.length > 0 && (
        <div className="p-2 border-gray-400 border-t">
          <div className="flex justify-between">
            <Button
              type="text"
              onClick={handleClearNotifications}
              style={{ width: "48%" }}>
              อ่านทั้งหมด
            </Button>
            <Divider type="vertical" style={{ height: "100%" }} />
            <Popconfirm
              title="ลบการแจ้งเตือนทั้งหมด"
              description="คุณต้องการลบการแจ้งเตือนทั้งหมดหรือไม่?"
              okText="ลบทั้งหมด"
              cancelText="ยกเลิก"
              onConfirm={handleDeleteAllNotifications}
              okButtonProps={{ danger: true }}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                style={{ width: "48%" }}>
                ลบทั้งหมด
              </Button>
            </Popconfirm>
          </div>
        </div>
      )}
    </div>
  );

  // สีและไอคอนตาม type ของการแจ้งเตือน
  function getNotificationColor(type) {
    switch (type) {
      case "success":
        return "#52c41a";
      case "warning":
        return "#faad14";
      case "error":
        return "#f5222d";
      case "info":
      default:
        return "#1890ff";
    }
  }

  function getNotificationIcon(notificationType) {
    switch (notificationType) {
      case "success":
        return <CheckCircleOutlined />;
      case "warning":
        return <WarningOutlined />;
      case "error":
        return <ExclamationCircleOutlined />;
      case "info":
      default:
        return <InfoCircleOutlined />;
    }
  }

  return (
    <Dropdown
      menu={{ items: [] }}
      dropdownRender={() => notificationItems}
      trigger={["click"]}
      placement="bottomLeft"
      onOpenChange={handleMenuClick}
      arrow={{
        pointAtCenter: true,
      }}>
      <Badge count={unreadCount} overflowCount={99}>
        <BellOutlined
          style={{
            fontSize: window.innerWidth < 768 ? "20px" : "24px",
            cursor: "pointer",
            color: "white",
          }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotiFications;
