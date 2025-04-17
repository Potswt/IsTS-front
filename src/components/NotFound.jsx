import { Button, Result } from "antd";
import { useNavigate } from "react-router";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex justify-center items-center h-screen w-screen">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button
            style={{
              backgroundColor: "#262362",
              transition: "background-color 0.3s",
              border: "none",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#193CB8")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#262362")}
            type="primary"
            onClick={() => navigate("/")}>
            Go Back
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;
