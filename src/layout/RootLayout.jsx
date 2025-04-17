import { Outlet } from "react-router";

const RootLayout = () => {
  return (
    <div>
      <div className="container">
        <Outlet />
      </div>
    </div>
  );
};
export default RootLayout;
