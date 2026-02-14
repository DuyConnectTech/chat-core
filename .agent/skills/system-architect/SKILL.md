---
name: system-architect
description: Chuyên gia phân tích kiến trúc mã nguồn, luồng dữ liệu và sự phụ thuộc. Sử dụng khi cần hiểu cấu trúc hệ thống, mô hình hóa kiến trúc hoặc tài liệu hóa luồng dữ liệu của dự án.
---

# SYSTEM ARCHITECT SKILL

Kỹ năng này biến Agent thành một kiến trúc sư hệ thống, có khả năng quét toàn bộ codebase và đưa ra cái nhìn tổng quan chính xác về cách hệ thống vận hành.

## Khi nào sử dụng kỹ năng này
- Khi người dùng yêu cầu phân tích cấu trúc dự án hoặc giải thích cách các thành phần tương tác.
- Khi cần vẽ sơ đồ kiến trúc (Architecure Diagram) bằng Mermaid.js.
- Khi cần theo dõi luồng dữ liệu (Data Flow) từ API, Socket đến Database.
- Khi cần kiểm tra sự phụ thuộc giữa các module và thư viện bên ngoài.

## Các quy tắc thực thi (Rules)
1. **Phân tích Đa tầng:** Luôn phân tích theo thứ tự: Router -> Controller -> Service -> Model.
2. **Trung thực với Codebase:** Chỉ báo cáo những gì thực sự tồn tại trong code. Nếu không tìm thấy, phải báo cáo là "Chưa có" thay vì giả định.
3. **Ưu tiên Service Layer:** Xác định các logic nghiệp vụ chính tại thư mục `services/` vì đây là trái tim của hệ thống.
4. **Trực quan hóa:** Sử dụng sơ đồ Mermaid.js để mô tả các luồng phức tạp.

## Quy trình phân tích (Workflow)

### 1. Phân tích mã nguồn
Quét các thư mục trọng yếu:
- `controllers/`: Cách hệ thống xử lý các yêu cầu đầu vào.
- `services/`: Các quy trình xử lý nghiệp vụ và logic AI.
- `models/`: Cấu trúc dữ liệu và các mối quan hệ (Associations).
- `routes/`: Danh sách các endpoints và middleware bảo mật.

### 2. Mô hình hóa kiến trúc
Xác định mô hình (ví dụ: MVC, Microservices) và vẽ sơ đồ tổng quát.
- Sử dụng Mermaid `graph TD` cho kiến trúc tổng thể.
- Sử dụng Mermaid `sequenceDiagram` cho luồng tin nhắn real-time.

### 3. Tài liệu hóa luồng dữ liệu
Ghi lại chi tiết cách dữ liệu di chuyển qua các lớp.
Ví dụ luồng "Gửi tin nhắn":
- **Input:** Socket event `message:send`.
- **Validation:** Kiểm tra quyền tham gia phòng.
- **Processing:** `chatService.sendMessage`.
- **AI Hook:** `geminiService.generateReply` (nếu Bot active).
- **Persistence:** Lưu vào bảng `messages` qua Sequelize.
- **Output:** Broadcast qua Socket `message:new`.

### 4. Phát hiện sự phụ thuộc
- Phân tích `package.json` để liệt kê các công nghệ cốt lõi.
- Xác định các tích hợp bên ngoài như Google Gemini API, MySQL.

## Đầu ra yêu cầu (Output)
Mỗi bản báo cáo phải có:
1. **Tổng quan hệ thống:** 1-2 đoạn văn tóm tắt mục đích và công nghệ.
2. **Sơ đồ Mermaid:** Trực quan hóa kiến trúc hoặc luồng dữ liệu.
3. **Phân tích Module:** Chi tiết chức năng của từng thư mục chính.
4. **Đánh giá & Khuyến nghị:** Nhận xét về độ sạch của code (Clean Code) và các điểm cần tối ưu.
