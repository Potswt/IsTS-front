import { useState, useEffect, useMemo } from "react";
import { Layout, Menu, Dropdown, Space, Avatar, message } from "antd";
import {
  TableOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
  MessageOutlined,
  LayoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import logo from "../../assets/jib-logo-2.png";
import { Content } from "antd/es/layout/layout";
import { Outlet } from "react-router";
import NotiFications from "../NotiFications";
import { Flag, ShieldCheck } from "lucide-react";
import { getUserDisplayName, getUserInitial } from "../../utils/userUtils";
import { useUser } from "../../context/UserContext";
import FloatingQrButton from "../FloatingQrButton";

const { Header, Sider } = Layout;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState("");

  // ใช้ context แทนการเก็บ state แยก
  const { user, clearUser } = useUser();

  // Define all menu items with role permissions
  const allMenuItems = useMemo(
    () => [
      {
        key: "1",
        icon: <LayoutOutlined />,
        label: <NavLink to="/">Overview</NavLink>,
        allowedroles: ["Admin", "SuperAdmin"],
      },
      {
        key: "2",
        icon: <TableOutlined />,
        label: <NavLink to="/table">Issues Table</NavLink>,
        allowedroles: ["Admin", "SuperAdmin"],
      },
      {
        key: "3",
        icon: <MessageOutlined />,
        label: <NavLink to="/messages">Messages</NavLink>,
        allowedroles: ["Admin", "SuperAdmin"],
      },
      {
        key: "4",
        icon: <Flag size={16} />,
        label: <NavLink to="/reports">Reports</NavLink>,
        allowedroles: ["SuperAdmin"],
      },
      {
        key: "5",
        icon: <ShieldCheck size={17} strokeWidth={1.25} absoluteStrokeWidth />,
        label: <NavLink to="/manage-roles">Manage Roles</NavLink>,
        allowedroles: ["SuperAdmin"],
      },
      {
        key: "6",
        icon: <UserOutlined />,
        label: <NavLink to="/user-management">User Management</NavLink>,
        allowedroles: ["SuperAdmin"],
      },
      {
        key: "7",
        icon: <SettingOutlined />,
        label: <NavLink to="/settings">Settings</NavLink>,
        allowedroles: ["Admin", "SuperAdmin", "User"],
      },
    ],
    []
  );

  // Filter menu items based on user role
  const filteredMenuItems = useMemo(() => {
    if (!user) return [];
    return allMenuItems.filter((item) => item.allowedroles.includes(user.role));
  }, [allMenuItems, user]);

  /**
   * ตรวจสอบ authentication
   */
  useEffect(() => {
    // ย้ายการตรวจสอบมาที่ App หรือ ProtectedRoute
    // เนื่องจาก UserContext จะจัดการข้อมูลให้แล้ว
    if (!user) {
      navigate("/login");
    }
  }, [navigate, user]);

  useEffect(() => {
    if (location.pathname === "/settings") {
      setSelectedKey("7");
    } else {
      // Make sure we handle the case when filteredMenuItems might be empty
      if (filteredMenuItems.length > 0) {
        const menuItem = filteredMenuItems.find(
          (item) => item.label.props.to === location.pathname
        );
        setSelectedKey(menuItem ? menuItem.key : "1");
      }
    }
  }, [location.pathname, filteredMenuItems]);

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
          to="/settings"
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
        width={187}>
        <div className="logo-container mt-6">
          <Link to="/">
            <img src={logo} alt="logo" />
          </Link>
        </div>
        <Menu
          style={{ marginTop: "25px" }}
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={filteredMenuItems}
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

export default Sidebar;
