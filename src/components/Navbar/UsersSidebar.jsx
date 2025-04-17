import { useState, useEffect, useMemo } from "react";
import { Layout, Menu, Dropdown, Space, Avatar, message } from "antd";
import {
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
  MessageOutlined,
  LayoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, NavLink, useLocation, useNavigate } from "react-router"; // Change to react-router-dom
import logo from "../../assets/jib-logo-2.png";
import { Content } from "antd/es/layout/layout";
import { Outlet } from "react-router";
import NotiFications from "../NotiFications";
import { getUserDisplayName, getUserInitial } from "../../utils/userUtils";
import { useUser } from "../../context/UserContext";
import FloatingQrButton from "../FloatingQrButton";

const { Header, Sider } = Layout;

const UsersSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState("");

  // ใช้ context แทนการเก็บ state แยก
  const { user, clearUser } = useUser();

  // Define menu items with role-based access
  const menuItems = useMemo(
    () => [
      {
        key: "1",
        icon: <LayoutOutlined />,
        label: <NavLink to="/user/home">Home</NavLink>,
      },
      {
        key: "2",
        icon: <MessageOutlined />,
        label: <NavLink to="/user/message">Messages</NavLink>,
      },
      {
        key: "3",
        icon: <SettingOutlined />,
        label: <NavLink to="/user/settings">Settings</NavLink>,
      },
    ],
    []
  );

  /**
   * ตรวจสอบ authentication และ role
   */
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user has User role
    if (user.role !== "User") {
      navigate("/unauthorized");
    }
  }, [navigate, user]);

  useEffect(() => {
    // Find selected key based on current path
    const path = location.pathname;
    if (path === "/user/home") setSelectedKey("1");
    else if (path === "/user/message") setSelectedKey("2");
    else if (path === "/user/settings") setSelectedKey("3");
    else setSelectedKey("");
  }, [location]);

  /**
   * Logout function - เรียกใช้ clearUser จาก context
   */
  const handleLogout = () => {
    clearUser(); // ใช้ฟังก์ชันจาก context แทน
    message.success("Logged out successfully");
    navigate("/login");
  };

  const accountdropdown = [
    {
      key: "1",
      label: (
        <NavLink
          to="/user/settings"
          style={{ display: "flex", alignItems: "center" }}>
          <SettingOutlined />
          <span style={{ marginLeft: "8px" }}>Settings</span>
        </NavLink>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "2",
      label: (
        <div
          onClick={handleLogout}
          style={{ display: "flex", alignItems: "center" }}>
          <LogoutOutlined />
          <span style={{ marginLeft: "8px" }}>Logout</span>
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ height: "100vh", width: "100vw" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        breakpoint="lg"
        collapsedWidth="50"
        className="bg-white"
        width={160}>
        <div className="logo-container mt-6">
          <Link to="/user/home">
            <img src={logo} alt="logo" />
          </Link>
        </div>
        <Menu
          style={{ marginTop: "25px" }}
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 0",
            backgroundColor: "#262362",
            zIndex: 1000,
          }}>
          <div className="flex mr-auto ml-5">
            <div className="flex items-center justify-center p-2 rounded-full transition-all duration-300 hover:bg-blue-900 hover:bg-opacity-20 active:bg-opacity-30 transform hover:scale-105 cursor-pointer">
              <NotiFications />
            </div>
          </div>
          <div className="flex mr-5">
            <Dropdown menu={{ items: accountdropdown }}>
              <a
                onClick={(e) => e.preventDefault()}
                style={{ marginLeft: "16px" }}>
                <Space className="text-white">
                  {user?.profileImage || user?.profilePicture ? (
                    <Avatar src={user.profileImage || user.profilePicture} />
                  ) : (
                    <Avatar icon={!user.profileImage && <UserOutlined />}>
                      {getUserInitial(user)}
                    </Avatar>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}>
                    <div style={{ lineHeight: "1.2", fontWeight: "500" }}>
                      {getUserDisplayName(user)}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        opacity: 0.8,
                        lineHeight: "1.2",
                      }}>
                      {user?.role}
                    </div>
                  </div>
                  <DownOutlined />
                </Space>
              </a>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ padding: "16px", overflow: "auto" }}>
          <Outlet />
        </Content>
        <FloatingQrButton />
      </Layout>
    </Layout>
  );
};

export default UsersSidebar;
