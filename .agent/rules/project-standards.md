# PROJECT RULES & STANDARDS

Tất cả các hành động của Agent trong dự án này phải tuân thủ các quy tắc sau:

## 1. Kiến trúc hệ thống
- **Strict MVC + Service:** Logic nghiệp vụ CHỈ được phép nằm trong `services/`. Controllers chỉ gọi Services.
- **Sequelize Best Practices:** Luôn sử dụng Transactions cho các thao tác tác động đến nhiều bảng (ví dụ: tạo tin nhắn và cập nhật `last_message_id`).
- **ES Modules:** Luôn sử dụng cú pháp `import`/`export`. Không sử dụng `require`.

## 2. Real-time & Socket.io
- Tất cả các sự kiện socket mới phải được định nghĩa trong `services/socket.service.js`.
- Phải có log rõ ràng cho các sự kiện `connection` và `disconnect`.

## 3. Bảo mật (Security)
- Tuyệt đối không lưu secret key (API Key, JWT Secret) trực tiếp vào code. Luôn dùng `process.env`.
- Mọi API endpoint mới (trừ Auth) phải được bọc bởi middleware `authenticate`.

## 4. Tài liệu hóa (Documentation)
- Khi thêm một Service hoặc Model mới, Agent phải tự động cập nhật file `README.md` hoặc `DEVELOPMENT_PLAN.md` nếu có yêu cầu.
- Luôn sử dụng JSDoc cho các phương thức trong Service để giải thích tham số và kiểu dữ liệu trả về.

## 5. Quy tắc Git
- Không bao giờ tự ý commit nếu không có yêu cầu rõ ràng.
- Commit message phải tuân thủ chuẩn: `type(scope): description` (ví dụ: `feat(chat): add group recall`).
