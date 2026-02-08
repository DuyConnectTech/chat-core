Mô tả logic xác thực người dùng (Authentication Flow)

Hệ thống sử dụng cơ chế xác thực dựa trên Access Token (JWT ngắn hạn) kết hợp Refresh Token, không phụ thuộc vào session xác thực truyền thống.

Access Token là JWT stateless, server không lưu trữ Access Token trong database; việc xác thực API được thực hiện bằng cách kiểm tra chữ ký và thời hạn của JWT. Refresh Token được lưu trữ an toàn dưới dạng HttpOnly Cookie trên client và dưới dạng hash trong database, được quản lý theo từng phiên thiết bị, hỗ trợ revoke, rotate và kiểm soát đăng nhập đa thiết bị.

1. Quy trình đăng nhập

Khi người dùng đăng nhập thành công, server thực hiện:

Sinh Access Token (JWT) có thời gian hết hạn ngắn (ví dụ: 15–60 phút).

Sinh Refresh Token là chuỗi ngẫu nhiên có độ bảo mật cao.

Hash Refresh Token và lưu vào bảng personal_access_tokens, bao gồm các thông tin:

user_id

token_hash

expires_at

revoked_at

Tạo một bản ghi trong bảng sessions, liên kết với refresh token, bao gồm:

user_id

refresh_token_id

ip_address

user_agent

last_activity_at

Trả Access Token cho frontend.

Gửi Refresh Token về client thông qua HttpOnly Cookie.

2. Xác thực API

Frontend sử dụng Access Token trong các request API.
Server xác thực request bằng cách kiểm tra chữ ký JWT và thời hạn hiệu lực của token, không truy vấn database.

3. Làm mới Access Token (Refresh Flow)

Khi Access Token sắp hết hạn hoặc đã hết hạn, frontend gọi endpoint refresh token.

Tại đây server:

Lấy Refresh Token từ HttpOnly Cookie.

Hash token và đối chiếu với bảng personal_access_tokens.

Kiểm tra:

Token tồn tại

Chưa hết hạn

Chưa bị revoke

Thuộc về session hợp lệ

Nếu hợp lệ, server:

Sinh Access Token (JWT) mới

(Khuyến nghị) Rotate Refresh Token:

Đánh dấu refresh token cũ là revoked

Sinh refresh token mới

Cập nhật lại HttpOnly Cookie

4. Đăng xuất (Logout Flow)

Khi người dùng đăng xuất:

Refresh Token hiện tại bị revoke trong personal_access_tokens

Session tương ứng bị đánh dấu inactive

HttpOnly Cookie bị xóa khỏi client

5. Vai trò của bảng sessions

Bảng sessions không dùng để xác thực API, mà chỉ để:

Quản lý đăng nhập đa thiết bị

Hỗ trợ đăng xuất từng thiết bị

Theo dõi hoạt động đăng nhập

Phát hiện hành vi bất thường

6. Lợi ích kiến trúc

Cơ chế này đảm bảo:

Access Token ngắn hạn giảm rủi ro bị lộ

Refresh Token được bảo vệ bởi HttpOnly Cookie

Có khả năng thu hồi phiên đăng nhập theo thiết bị

Hệ thống mở rộng tốt cho SPA/mobile app

Không phụ thuộc vào server session state