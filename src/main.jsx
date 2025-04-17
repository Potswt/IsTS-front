import React from "react";
import ReactDOM, { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router";
import { ConfigProvider, unstableSetRender } from "antd";
import { UserProvider } from "./context/UserContext";
import { SocketProvider } from "./context/SocketContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider>
      <BrowserRouter>
        <UserProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </UserProvider>
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
unstableSetRender((node, container) => {
  container._reactRoot ||= createRoot(container);
  const root = container._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});
