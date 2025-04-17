import { useState } from "react";
import { Button, message } from "antd";
import { DownloadOutlined, LoadingOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PropTypes from "prop-types";
import dayjs from "dayjs";

const ExportButton = ({ data, filename, dateRange }) => {
  const [loading, setLoading] = useState(false);

  // ฟังก์ชันสร้างชื่อไฟล์ที่มีวันที่ปัจจุบันและช่วงเวลาที่กรอง
  const generateFilename = () => {
    const date = new Date().toISOString().slice(0, 10);
    const baseFilename = filename || "report";
    const dateRangeText = dateRange ? `_${dateRange}` : "";
    return `${baseFilename}${dateRangeText}_${date}`;
  };

  // ฟังก์ชันสำหรับ Export เป็น Excel
  const exportToExcel = () => {
    try {
      setLoading(true);

      // ดึงข้อมูลที่ต้องการ Export และทำการกรองข้อมูลที่ไม่ต้องการออก
      const exportData = data.map((item) => {
        // แยกข้อมูลที่จำเป็นออกมา โดยไม่ใช้ destructuring ของส่วนที่ไม่ต้องการ
        const submitter = item.submitter;
        const assignedAdmin = item.assignedAdmin;

        // สร้างข้อมูลในรูปแบบที่เหมาะสมสำหรับการแสดงใน Excel
        return {
          หัวข้อ: item.title || item.topic || "-",
          รายละเอียด: item.description || "-",
          วันที่: dayjs(item.date).format("DD/MM/YYYY"),
          สถานะ:
            item.status === "completed"
              ? "เสร็จสิ้น"
              : item.status === "rejected"
              ? "ถูกปฏิเสธ"
              : item.status === "pending"
              ? "รอดำเนินการ"
              : item.status === "approved"
              ? "อนุมัติแล้ว"
              : item.status,
          ผู้แจ้ง: submitter?.name || "-",
          แผนก: submitter?.department || "-",
          ผู้รับผิดชอบ: assignedAdmin?.name || "-",
          คะแนนความพึงพอใจ: item.rating
            ? `${item.rating} ดาว`
            : "ไม่มีการให้คะแนน",
          หมายเหตุ: item.comment || "-",
        };
      });

      // สร้าง worksheet จากข้อมูลที่เตรียมไว้
      const ws = XLSX.utils.json_to_sheet(exportData);

      // ปรับแต่งความกว้างคอลัมน์ให้เหมาะสม
      const colWidths = [
        { wch: 30 }, // หัวข้อ
        { wch: 50 }, // รายละเอียด
        { wch: 15 }, // วันที่
        { wch: 15 }, // สถานะ
        { wch: 20 }, // ผู้แจ้ง
        { wch: 20 }, // แผนก
        { wch: 20 }, // ผู้รับผิดชอบ
        { wch: 20 }, // คะแนนความพึงพอใจ
        { wch: 30 }, // หมายเหตุ
      ];
      ws["!cols"] = colWidths;

      // สร้าง workbook และเพิ่ม worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reports");

      // สร้างไฟล์ Excel
      const excelBuffer = XLSX.write(wb, {
        bookType: "xlsx",
        type: "array",
        bookSST: false, // ช่วยให้รองรับภาษาไทย
        cellStyles: true, // เปิดใช้งาน cell styles
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // บันทึกไฟล์
      saveAs(blob, `${generateFilename()}.xlsx`);

      message.success("ส่งออกข้อมูลเป็น Excel สำเร็จ");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.error("ไม่สามารถส่งออกข้อมูลเป็น Excel ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="primary"
      icon={loading ? <LoadingOutlined /> : <DownloadOutlined />}
      loading={loading}
      disabled={!data.length || loading}
      onClick={exportToExcel}
      style={{
        backgroundColor: "#262362",
        transition: "background-color 0.3s",
        border: "none",
        fontWeight: "bold",
      }}
      onMouseEnter={(e) => (e.target.style.backgroundColor = "#193CB8")}
      onMouseLeave={(e) => (e.target.style.backgroundColor = "#262362")}>
      {loading ? "กำลังส่งออกเป็น Excel..." : "ส่งออกเป็น Excel"}
    </Button>
  );
};

ExportButton.propTypes = {
  data: PropTypes.array.isRequired,
  filename: PropTypes.string,
  dateRange: PropTypes.string,
};

export default ExportButton;
