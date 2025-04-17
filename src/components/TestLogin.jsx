import { Button, Space, Typography } from "antd";
import { testLoginAPI, verifyUserData } from "../utils/apiDebug";

const { Text } = Typography;

const TestLogin = () => {
  const runTest = async () => {
    try {
      // Use test credentials - replace with valid test credentials for your system
      await testLoginAPI("admin", "password123");
    } catch (error) {
      console.error("Test failed:", error);
    }
  };

  const checkUserData = () => {
    verifyUserData();
  };

  const clearData = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // console.log("User data and token cleared from localStorage");
  };

  return (
    <div
      style={{ marginTop: "20px", padding: "10px", border: "1px dashed #ccc" }}>
      <Text type="secondary">Debug Panel</Text>
      <Space direction="vertical" style={{ width: "100%", marginTop: "10px" }}>
        <Button size="small" onClick={runTest}>
          Test Login API
        </Button>
        <Button size="small" onClick={checkUserData}>
          Check User Data
        </Button>
        <Button size="small" onClick={clearData} danger>
          Clear User Data
        </Button>
      </Space>
    </div>
  );
};

export default TestLogin;
