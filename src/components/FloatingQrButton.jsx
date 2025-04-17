import { useState } from "react";
import { Button, Modal, Typography } from "antd";
import { QrcodeOutlined } from "@ant-design/icons";
import LineQrImage from "../assets/IsTS-qr.jpg";

const { Title, Paragraph } = Typography;

const FloatingQrButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Floating QR Code Button */}
      <Button
        type="primary"
        shape="circle"
        icon={<QrcodeOutlined />}
        size="large"
        onClick={showModal}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          zIndex: 1000,
          width: "50px",
          height: "50px",
          backgroundColor: "#262362",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transition: "all 0.3s",
        }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = "#193CB8")}
        onMouseLeave={(e) => (e.target.style.backgroundColor = "#262362")}
      />

      {/* QR Code Modal */}
      <Modal
        title="QR Code LINE Official"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        centered
      >
        <div className="flex flex-col items-center">
          <img
            src={LineQrImage}
            alt="Line Official QR Code"
            style={{ width: 200, height: 200, marginBottom: 16 }}
          />
          <Title level={5} style={{ marginBottom: 8 }}>
            สแกนเพื่อติดตามการแจ้งเตือนสถานะคำร้อง
          </Title>
          <Paragraph type="secondary" style={{ textAlign: "center" }}>
            สแกน QR Code นี้เพื่อรับการแจ้งเตือนสถานะคำร้องผ่าน Line Official
          </Paragraph>
        </div>
      </Modal>
    </>
  );
};

export default FloatingQrButton;