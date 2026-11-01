# BAO PERFORMANCE PORTFOLIO CMS — BẢN TRIỂN KHAI MỚI

## Tên tài nguyên mới
- Worker: `bao-performance-portfolio-cms`
- D1 database: `bao-portfolio-cms-db`
- D1 table: `bao_portfolio_content_v2`
- Admin: `/admin`

Bộ này độc lập với Worker/database cũ. Không sửa hoặc ghi đè website đang chạy. Giao diện public lấy từ bản portfolio hiện tại; nội dung tĩnh vẫn hiển thị nếu API CMS chưa có dữ liệu.

## Bạn chỉ cần thao tác trên Cloudflare (một lần)
1. Cloudflare Dashboard → Workers & Pages → D1 SQL Database → Create database. Đặt tên chính xác `bao-portfolio-cms-db`.
2. Mở database vừa tạo → Console → chạy toàn bộ nội dung file `schema.sql`.
3. Copy Database ID mới và thay `PASTE_NEW_D1_DATABASE_ID_HERE` trong `wrangler.toml`.
4. Deploy Worker mới tên `bao-performance-portfolio-cms` từ thư mục này bằng Wrangler (`npx wrangler deploy`). Không chọn Worker `portfolio` cũ.
5. Trong Worker mới → Settings → Variables and Secrets, tạo hai secret:
   - `ADMIN_PASSWORD`: mật khẩu đăng nhập `/admin` do bạn tự đặt.
   - `SESSION_SECRET`: chuỗi ngẫu nhiên dài tối thiểu 32 ký tự.
6. Deploy lại sau khi thêm secrets. Mở URL `*.workers.dev` của Worker mới, kiểm tra trang chủ và `/admin`.

## Cấu hình D1 binding
`wrangler.toml` đã khai báo binding `DB` và database name. Chỉ thay đúng ID của database mới. Không dùng lại ID database cũ.

## CMS hiện tại
Có thể sửa tên hiển thị, chức danh, giới thiệu, thông tin kinh nghiệm và mô tả 4 nhóm công việc. Ảnh/video chưa hỗ trợ upload trực tiếp; dùng URL HTTPS công khai cho media cần thiết. Không có chỉ số hiệu quả hay thành tích nào được tự bịa.

## Bảo mật
Mật khẩu và SESSION_SECRET chỉ đặt trong Cloudflare Secrets, không ghi vào source code. Cookie quản trị HttpOnly/Secure/SameSite=Strict; phiên hết hạn sau 8 giờ.
