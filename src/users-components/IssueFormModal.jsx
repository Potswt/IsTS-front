import { useEffect, useState } from "react";
import { Modal, Form, Input, DatePicker, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import PropTypes from "prop-types";

const IssueFormModal = ({ visible, onOk, onCancel, editingRecord }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (editingRecord) {
      const topicValue =
        editingRecord.topic || editingRecord.title || editingRecord.issue || "";

      const issueDate =
        editingRecord.date ||
        editingRecord.createdAt ||
        editingRecord.updatedAt;

      form.setFieldsValue({
        topic: topicValue,
        description: editingRecord.description || "",
        date: issueDate ? dayjs(issueDate) : dayjs(),
      });

      if (editingRecord.file) {
        const fileName = editingRecord.file.split("/").pop();
        setFileList([
          {
            uid: "1",
            name: fileName,
            status: "done",
            url: editingRecord.file,
          },
        ]);
      } else {
        setFileList([]);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({
        date: dayjs(),
      });
      setFileList([]);
    }
  }, [editingRecord, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        const formData = new FormData();

        formData.append("topic", values.topic);
        formData.append("description", values.description);

        if (values.date) {
          const isoDate = values.date.toISOString();
          formData.append("date", isoDate);
        }

        if (fileList.length > 0 && fileList[0].originFileObj) {
          formData.append("file", fileList[0].originFileObj);
        }

        onOk(formData);
      })
      .catch((info) => {
        console.log("Form validation failed:", info);
      });
  };

  const handleFileChange = (info) => {
    if (info.fileList.length > 1) {
      info.fileList = [info.fileList[info.fileList.length - 1]];
    }

    if (info.file.size && info.file.size > 5 * 1024 * 1024) {
      message.error("ไฟล์ต้องมีขนาดไม่เกิน 5MB!");
      info.fileList = info.fileList.filter((f) => f.uid !== info.file.uid);
    }

    setFileList(info.fileList);
  };

  const beforeUpload = (file) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      message.error(
        "สามารถอัพโหลดเฉพาะไฟล์รูปภาพ (JPEG/PNG), PDF, หรือ Word (DOC/DOCX) เท่านั้น"
      );
      return false;
    }

    return false;
  };

  return (
    <Modal
      title={editingRecord ? "แก้ไขคำร้อง" : "เพิ่มคำร้องใหม่"}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okButtonProps={{
        style: {
          backgroundColor: "#262362",
          transition: "background-color 0.3s",
          border: "none",
          borderRadius: "8px", 
        },
        onMouseEnter: (e) => (e.target.style.backgroundColor = "#193CB8"),
        onMouseLeave: (e) => (e.target.style.backgroundColor = "#262362"),
      }}
      forceRender>
      <Form form={form} layout="vertical">
        <Form.Item
          name="topic"
          label="หัวข้อคำร้อง"
          rules={[{ required: true, message: "กรุณากรอกหัวข้อคำร้อง!" }]}>
          <Input placeholder="กรอกหัวข้อคำร้อง" />
        </Form.Item>

        <Form.Item
          name="description"
          label="รายละเอียด"
          rules={[{ required: true, message: "กรุณากรอกรายละเอียด!" }]}>
          <Input.TextArea rows={4} placeholder="กรอกรายละเอียดคำร้อง" />
        </Form.Item>

        <Form.Item
          name="date"
          label="วันที่"
          rules={[{ required: true, message: "กรุณาเลือกวันที่!" }]}>
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item label="แนบไฟล์">
          <Upload
            listType="picture"
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={beforeUpload}
            maxCount={1}>
            <Button icon={<UploadOutlined />}>เลือกไฟล์</Button>
          </Upload>
          <div className="mt-2 text-gray-400 text-xs">
            สามารถอัพโหลดไฟล์รูปภาพ (JPEG/PNG), PDF, หรือ Word (DOC/DOCX)
            ที่มีขนาดไม่เกิน 5MB
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

IssueFormModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onOk: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editingRecord: PropTypes.shape({
    issueId: PropTypes.string,
    _id: PropTypes.string,
    id: PropTypes.string,
    topic: PropTypes.string,
    title: PropTypes.string,
    issue: PropTypes.string,
    description: PropTypes.string,
    date: PropTypes.string,
    file: PropTypes.string,
    status: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
  }),
};

export default IssueFormModal;
