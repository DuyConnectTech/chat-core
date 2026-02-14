# WORKFLOW: System Architecture Analysis
description: Chạy quy trình phân tích toàn diện kiến trúc hệ thống, vẽ sơ đồ và báo cáo sự phụ thuộc.

## Steps:
1. **Quét mã nguồn:** Agent sử dụng kỹ năng `system-architect` để liệt kê tất cả các Routes, Controllers, Services và Models.
2. **Kiểm tra sự phụ thuộc:** Phân tích `package.json` và các lệnh `import` để xác định các thư viện bên ngoài và mối liên hệ giữa các module nội bộ.
3. **Vẽ sơ đồ:** Tạo sơ đồ Mermaid.js mô tả luồng dữ liệu chính của ứng dụng (ví dụ: luồng Auth và luồng Chat).
4. **Đánh giá chuẩn (Audit):** Đối chiếu với `project-standards.md` để phát hiện các lỗi vi phạm kiến trúc (ví dụ: logic nằm sai chỗ).
5. **Báo cáo:** Xuất kết quả ra một file Markdown mới trong thư mục `storage/logs/arch-analysis-[timestamp].md`.
