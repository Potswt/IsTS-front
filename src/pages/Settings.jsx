import { Layout, Tabs } from "antd";
import AccountSettings from "../components/Settings/AccountSettings";
import ChangePassword from "../components/Settings/ChangePassword";

const { Content } = Layout;

const Settings = () => {
  const tabItems = [
    {
      key: "1",
      label: "Account Settings",
      children: <AccountSettings />,
    },
    {
      key: "2",
      label: "Change Password",
      children: <ChangePassword />,
    },
  ];

  return (
    <Layout style={{ height: "auto" }}>
      <Content
        style={{
          margin: "30px auto",
          padding: 24,
          borderRadius: "8px",
          background: "#fff",
          maxWidth: "90%", // Adjust to fit the screen
          width: "600px", // Set a fixed width
        }}>
        <Tabs defaultActiveKey="1" items={tabItems} />
      </Content>
    </Layout>
  );
};

export default Settings;
