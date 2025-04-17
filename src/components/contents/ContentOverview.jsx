import { Layout, theme } from "antd";
import { Content } from "antd/es/layout/layout";
import AssignmentTable from "../assignment-table/AssignmentTable";
import TopCard from "../TopCard";
const ContentOverview = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout>
      <div className="mx-2">
        <TopCard />
      </div>
      <Content
        className="rounded-lg"
        style={{
          margin: "45px 10px",
          padding: 24,
          borderRadius: borderRadiusLG,
          background: colorBgContainer,
        }}>
        <>
          <span className="text-2xl font-semibold mb-4 p-5">คำร้องใหม่</span>
          <AssignmentTable />
        </>
      </Content>
    </Layout>
  );
};

export default ContentOverview;
