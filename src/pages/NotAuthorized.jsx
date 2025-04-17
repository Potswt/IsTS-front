import { Result, Button } from "antd";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

const NotAuthorized = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserRole(user.role);
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  const handleRedirect = () => {
    // Redirect based on user role
    if (userRole === "User") {
      navigate("/user/home");
    } else if (userRole === "Admin" || userRole === "SuperAdmin") {
      navigate("/");
    } else {
      // If role is unknown or not logged in, go to login
      navigate("/login");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}>
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button
            type="primary"
            onClick={handleRedirect}
            style={{
              backgroundColor: "#262362",
              transition: "background-color 0.3s",
              border: "none",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#193CB8")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#262362")}>
            Go Back
          </Button>
        }
      />
    </div>
  );
};

export default NotAuthorized;
