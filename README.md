ssue Support and Tracking System (IsTS)

<img alt="React" src="https://img.shields.io/badge/React-19-blue.svg">
<img alt="Node.js" src="https://img.shields.io/badge/Node.js-16.x-green.svg">
<img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-4.x-green.svg">
<img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg">

📝 รายละเอียดโครงการ
Issue Support and Tracking System (IsTS) เป็นระบบจัดการและติดตามคำร้องของพนักงานในองค์กร ช่วยให้พนักงานสามารถรายงานปัญหาหรือคำร้องต่างๆ และผู้ดูแลระบบสามารถติดตาม จัดการ และตอบสนองต่อคำร้องเหล่านั้นได้อย่างมีประสิทธิภาพ

✨ คุณสมบัติหลัก
การจัดการผู้ใช้: ระบบสมาชิกพร้อมบทบาทแบบหลายระดับ (User, Admin, SuperAdmin)
การจัดการคำร้อง: ผู้ใช้สามารถสร้าง แก้ไข และติดตามคำร้องของตนเอง
ระบบการมอบหมายงาน: ผู้ดูแลระบบสามารถมอบหมายคำร้องให้กับแอดมินที่เหมาะสม
ระบบแชท: การสื่อสารแบบเรียลไทม์ระหว่างผู้ใช้และผู้ดูแลระบบ
การแจ้งเตือน: แจ้งเตือนผู้ใช้และผู้ดูแลระบบเมื่อมีการเปลี่ยนแปลงสถานะหรือมีข้อความใหม่
การอัปโหลดไฟล์: รองรับการอัปโหลดไฟล์แนบสำหรับคำร้องและการแชท
การส่งออกข้อมูล: ความสามารถในการส่งออกรายงานในรูปแบบตาราง
การเชื่อมต่อ LINE: ส่งการแจ้งเตือนผ่านแพลตฟอร์ม LINE
การให้คะแนน: ผู้ใช้สามารถให้คะแนนการแก้ไขปัญหา

🔧 เทคโนโลยีที่ใช้
Frontend (IsTS-front)
React.js + Vite
Ant Design (UI Framework)
Axios (HTTP Client)
Socket.io Client (Real-time communication)
Day.js (Date manipulation)

Backend (IsTS_back)
Node.js + Express
MongoDB และ Mongoose (Database)
JWT (Authentication)
Socket.io (Real-time communication)
Multer (File uploads)
LINE Messaging API

🚀 การติดตั้งและการใช้งาน
ความต้องการเบื้องต้น
Node.js (v14 หรือใหม่กว่า)
MongoDB
LINE Developer Account (สำหรับการแจ้งเตือนผ่าน LINE)

🔒 ระดับผู้ใช้งานและสิทธิ์การเข้าถึง
User: สามารถสร้างและติดตามคำร้องของตนเอง, แชทกับผู้ดูแลระบบ, และให้คะแนนการแก้ไขปัญหา
Admin: สามารถจัดการคำร้อง, มอบหมายงาน, และสื่อสารกับผู้ใช้
SuperAdmin: มีสิทธิ์เข้าถึงทั้งหมด รวมถึงการจัดการผู้ใช้และการกำหนดบทบาท
📊 สถานะของคำร้อง
รอดำเนินการ (pending): คำร้องที่ยังไม่ได้รับการจัดการ
อนุมัติแล้ว (approved): คำร้องที่ได้รับการอนุมัติและกำลังดำเนินการ
ถูกปฏิเสธ (rejected): คำร้องที่ถูกปฏิเสธพร้อมเหตุผล
เสร็จสิ้น (completed): คำร้องที่ได้รับการแก้ไขเรียบร้อยแล้ว

👥 ผู้พัฒนา
Your Name - Potsawat Krudprasert
Contributor Name - Masa Wianwong

📄 ลิขสิทธิ์
Copyright © 2023. All rights reserved.
