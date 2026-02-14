# GEMINI.md - Project Context & Instructions

Dự án **Chat Core** là một hệ thống nhắn tin thời gian thực (Real-time Chat) được thiết kế cho mục đích đào tạo (Intern Edition). Hệ thống hỗ trợ chat 1-1, chat nhóm và tích hợp AI Gemini để gợi ý phản hồi.

## 1. Project Overview

- **Tech Stack:**
    - **Backend:** Node.js (ES Modules), Express.js.
    - **Database:** MySQL với Sequelize ORM.
    - **Real-time:** Socket.io.
    - **Frontend:** EJS (View Engine), SCSS, JavaScript (Bundled by ESBuild).
    - **AI:** Google Gemini API (`@google/generative-ai`).
- **Architecture:** MVC + Service Layer.
    - **Models:** Định nghĩa cấu trúc dữ liệu và quan hệ (Associations).
    - **Services:** Nơi chứa 100% logic nghiệp vụ (Business Logic). Đây là phần quan trọng nhất.
    - **Controllers:** Tiếp nhận Request, gọi Service và trả về Response (JSON hoặc View).
    - **Routes:** Định nghĩa các điểm cuối API và điều hướng trang web.

## 2. Core Components & Logic

- **Chat Logic (`services/chat.service.js`):** Xử lý tạo cuộc hội thoại (private/group), gửi tin nhắn, thu hồi tin nhắn, và quản lý thành viên.
- **Real-time Logic (`services/socket.service.js`):** Quản lý kết nối Socket.io, tham gia phòng (rooms), và phát tín hiệu (emit) tin nhắn mới.
- **AI Logic (`services/gemini.service.js`):** Kết nối với Google Gemini để phân tích ngữ cảnh cuộc trò chuyện và gợi ý câu trả lời.
- **Authentication:** Sử dụng Session-based cho Web và hỗ trợ Token-based cho các kết nối bảo mật.

## 3. Building and Running

### Prerequisites
- Node.js (v18+)
- MySQL Server
- Google Gemini API Key

### Commands
- **Install Dependencies:** `npm install`
- **Development Mode:** `npm run dev` (Chạy đồng thời Nodemon, Sass watcher và ESBuild watcher).
- **Production Build:** `npm run build`
- **Start Production:** `npm start`

### Environment Configuration (`.env`)
```env
PORT=3000
DB_NAME=intern_chat_core
DB_USER=root
DB_PASS=your_password
DB_HOST=localhost
GEMINI_API_KEY=your_api_key
MODEL_AI=gemini-2.5-flash
LIMIT_HISTORY_CHAT=5
```

## 4. Development Conventions

- **Code Style:** Sử dụng ES Modules (`import`/`export`). Đặt tên file theo kiểu `kebab-case` hoặc `camelCase` tùy thư mục (theo các file hiện có).
- **Service Layer:** Luôn viết logic nghiệp vụ trong `services/`. Không viết logic xử lý dữ liệu trực tiếp trong Controller.
- **Database:**
    - Sử dụng `sequelize.sync({ alter: true })` trong môi trường phát triển để tự động cập nhật schema.
    - Các quan hệ (Associations) được định nghĩa tập trung tại `models/index.js`.
- **Frontend Assets:**
    - Sửa SCSS trong `src/scss/`, nó sẽ tự động compile ra `public/css/`.
    - Sửa JS trong `src/js/`, nó sẽ được bundle bởi ESBuild vào `public/js/`.
- **Error Handling:** Sử dụng `utils/async-handler.js` để bao bọc các hàm async trong controller nhằm bắt lỗi tập trung.

## 5. Directory Structure
- `config/`: Cấu hình hệ thống (DB, v.v.).
- `controllers/`: Xử lý Request/Response.
- `models/`: Định nghĩa Sequelize Models.
- `routes/`: Định nghĩa URL paths.
- `services/`: Logic nghiệp vụ (Quan trọng).
- `src/`: Mã nguồn Frontend (SCSS, JS).
- `views/`: Giao diện EJS templates.
- `public/`: Assets tĩnh đã được biên dịch.
- `utils/`: Các hàm tiện ích bổ trợ.
