import { Layout } from "antd";
import ContentMessages from "../components/contents/chat/ContentMessages";
import UserContentMessages from "../components/contents/chat/UserContentMessages";
import { useUser } from "../context/UserContext";

const { Content } = Layout;

const Messages = () => {
  const { user } = useUser();
  const isUser = user?.role === "User";

  return (
    <Layout>
      <Content
        style={{
          margin: "30px 16px",
          padding: 24,
          minHeight: 280,
          borderRadius: "8px",
          background: "#fff",
        }}>
        {isUser ? <UserContentMessages /> : <ContentMessages />}
      </Content>
    </Layout>
  );
};

export default Messages;
