# HỆ THỐNG ĐIỂM DANH SINH VIÊN BẰNG NHẬN DIỆN KHUÔN MẶT

## 1. Giới thiệu

Đây là hệ thống điểm danh sinh viên sử dụng công nghệ nhận diện khuôn mặt, được xây dựng nhằm hỗ trợ nhà trường, quản trị viên và giảng viên trong việc quản lý lớp học phần, sinh viên, buổi học và dữ liệu điểm danh.

Hệ thống cho phép giảng viên mở phiên điểm danh bằng camera, sinh viên được nhận diện khuôn mặt tự động và kết quả điểm danh được ghi nhận trực tiếp vào cơ sở dữ liệu. Ngoài ra, hệ thống còn tích hợp trợ lý AI giúp admin và giảng viên thao tác nhanh bằng ngôn ngữ tự nhiên.

## 2. Chức năng chính

### 2.1. Chức năng dành cho Admin

- Đăng nhập hệ thống với vai trò quản trị viên.
- Quản lý tài khoản người dùng.
- Tạo tài khoản admin, giảng viên và sinh viên.
- Khóa, mở khóa, đổi mật khẩu hoặc xóa tài khoản.
- Quản lý danh sách sinh viên.
- Quản lý danh sách giảng viên.
- Quản lý môn học.
- Quản lý khoa và lớp sinh viên.
- Quản lý lớp học phần.
- Phân công giảng viên phụ trách lớp học phần.
- Đăng ký sinh viên vào lớp học phần.
- Hủy đăng ký sinh viên khỏi lớp học phần.
- Quản lý dữ liệu khuôn mặt sinh viên.
- Thu thập dữ liệu khuôn mặt từ camera/DroidCam.
- Xóa dữ liệu khuôn mặt.
- Đồng bộ dữ liệu khuôn mặt từ thư mục dataset.
- Train dữ liệu khuôn mặt để tạo cơ sở dữ liệu nhận diện.
- Sử dụng chatbot AI để hỗ trợ thao tác quản trị.

### 2.2. Chức năng dành cho Giảng viên

- Đăng nhập hệ thống với vai trò giảng viên.
- Xem danh sách lớp học phần được phân công.
- Xem chi tiết lớp học phần.
- Xem danh sách sinh viên trong lớp học phần.
- Tạo buổi học.
- Mở điểm danh cho buổi học.
- Điểm danh thủ công cho sinh viên.
- Bắt đầu phiên điểm danh bằng nhận diện khuôn mặt.
- Theo dõi kết quả điểm danh realtime.
- Dừng phiên điểm danh.
- Kết thúc buổi học và tự động đánh dấu vắng sinh viên chưa điểm danh.
- Xem lịch sử điểm danh.
- Xem chi tiết điểm danh theo từng buổi học.
- Cập nhật thông tin cá nhân.
- Đổi mật khẩu.
- Sử dụng chatbot AI để tạo buổi học, xem lớp, xem điểm danh hoặc thao tác nhanh.

### 2.3. Chức năng nhận diện khuôn mặt

- Thu thập ảnh khuôn mặt sinh viên từ camera hoặc DroidCam.
- Lưu ảnh khuôn mặt theo từng mã sinh viên trong thư mục `dataset`.
- Lọc ảnh mờ để tăng chất lượng dữ liệu.
- Sử dụng InsightFace để trích xuất embedding khuôn mặt.
- Tạo file cơ sở dữ liệu khuôn mặt `face_db.npz`.
- Nhận diện khuôn mặt realtime từ camera.
- Kiểm tra sinh viên có thuộc lớp học phần hay không.
- Kiểm tra trạng thái buổi học có đang mở điểm danh hay không.
- Ghi nhận điểm danh tự động vào cơ sở dữ liệu PostgreSQL.

### 2.4. Chức năng trợ lý AI

- Chatbot hỗ trợ admin và giảng viên thao tác bằng tiếng Việt.
- Phân tích câu lệnh tự nhiên của người dùng.
- Tự động xác định chức năng cần thực hiện.
- Kiểm tra quyền theo vai trò người dùng.
- Hỏi lại người dùng nếu thiếu thông tin.
- Gọi service tương ứng trong backend để thực thi thao tác.
- Trả kết quả ở dạng dễ đọc cho frontend hiển thị.

Ví dụ:

```txt
Tạo buổi học cho lớp LHP001 ngày 20/05/2026 từ 07:00 đến 09:30
```

```txt
Mở điểm danh cho buổi học id 15
```

```txt
Cho tôi xem danh sách sinh viên lớp LHP003
```

```txt
Điểm danh sinh viên SV001 có mặt cho buổi 12
```

## 3. Công nghệ sử dụng

### 3.1. Frontend

- ReactJS
- Vite
- Axios
- React Router
- CSS

### 3.2. Backend

- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- bcrypt / bcryptjs
- express-validator
- dotenv
- cors
- Google Gemini API

### 3.3. AI nhận diện khuôn mặt

- Python
- OpenCV
- InsightFace
- NumPy
- psycopg2
- DroidCam hoặc camera IP

## 4. Cấu trúc thư mục dự án

```txt
FACE-ID/
├── AI-Face-ID/
│   ├── collect_data_cli.py
│   ├── train_face_db.py
│   ├── recognize_and_log.py
│   ├── dataset/
│   └── face_db.npz
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── Admin_Controller.js
│   │   │   ├── Assistant_Controller.js
│   │   │   ├── Auth_Controller.js
│   │   │   └── GiangVien_Controller.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── AuthMiddleware.js
│   │   │   ├── RoleMiddleware.js
│   │   │   └── ValidationMiddleware.js
│   │   │
│   │   ├── models/
│   │   │   ├── Admin_Model.js
│   │   │   └── GiangVien_Model.js
│   │   │
│   │   ├── routes/
│   │   │   ├── Admin_Router.js
│   │   │   ├── Assistant_Router.js
│   │   │   ├── Auth_Router.js
│   │   │   └── GiangVien_Router.js
│   │   │
│   │   ├── services/
│   │   │   ├── Admin_Service.js
│   │   │   ├── Assistant_Service.js
│   │   │   ├── Auth_Service.js
│   │   │   └── GiangVien_Service.js
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   ├── password.js
│   │   │   └── response.js
│   │   │
│   │   ├── validation/
│   │   │   └── index.js
│   │   │
│   │   └── app.js
│   │
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── Admin_api.js
    │   │   ├── Assistant_api.js
    │   │   ├── Auth_api.js
    │   │   └── GiangVien_api.js
    │   │
    │   ├── components/
    │   │   ├── AdminLayout.jsx
    │   │   ├── AdminSidebar.jsx
    │   │   ├── AssistantChatBox.jsx
    │   │   └── Sidebar.jsx
    │   │
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   │
    │   │   ├── admin/
    │   │   │   ├── AccountsPage.jsx
    │   │   │   ├── AdminDashboardPage.jsx
    │   │   │   ├── CourseSectionsPage.jsx
    │   │   │   ├── FaceDataPage.jsx
    │   │   │   ├── LecturersPage.jsx
    │   │   │   ├── StudentsPage.jsx
    │   │   │   └── SubjectsPage.jsx
    │   │   │
    │   │   └── giang-vien/
    │   │       ├── AttendanceTodayPage.jsx
    │   │       ├── ClassDetailPage.jsx
    │   │       ├── DiemDanhPage.jsx
    │   │       ├── GiangVienDashboard.jsx
    │   │       ├── LichSuDiemDanhPage.jsx
    │   │       ├── LopHocPhanPage.jsx
    │   │       └── ProfilePage.jsx
    │   │
    │   └── App.jsx
    │
    ├── .env
    ├── package.json
    └── vite.config.js
```

## 5. Mô tả các thành phần chính

### 5.1. AI-Face-ID

Thư mục `AI-Face-ID` chứa các file Python phục vụ cho việc thu thập, huấn luyện và nhận diện khuôn mặt.

#### collect_data_cli.py

File này dùng để thu thập ảnh khuôn mặt sinh viên từ camera hoặc DroidCam.

Chức năng chính:

- Mở camera từ `camera_url`.
- Phát hiện khuôn mặt bằng OpenCV Haar Cascade.
- Cắt vùng khuôn mặt.
- Kiểm tra ảnh mờ trước khi lưu.
- Lưu ảnh vào thư mục:

```txt
dataset/<ma_sv>/
```

Ví dụ:

```bash
python collect_data_cli.py --person-id SV001 --camera-url http://192.168.1.10:4747/video --max-images 80
```

#### train_face_db.py

File này dùng để train dữ liệu khuôn mặt.

Chức năng chính:

- Đọc ảnh trong thư mục `dataset`.
- Sử dụng InsightFace để trích xuất embedding.
- Tính embedding trung bình cho mỗi sinh viên.
- Chuẩn hóa vector embedding.
- Lưu dữ liệu vào file:

```txt
face_db.npz
```

Chạy lệnh:

```bash
python train_face_db.py
```

#### recognize_and_log.py

File này dùng để nhận diện khuôn mặt realtime và ghi nhận điểm danh.

Chức năng chính:

- Mở camera realtime.
- Load file `face_db.npz`.
- Nhận diện khuôn mặt bằng InsightFace.
- So sánh khuôn mặt với dữ liệu đã train.
- Kiểm tra sinh viên có tồn tại trong cơ sở dữ liệu.
- Kiểm tra sinh viên có đăng ký lớp học phần hay không.
- Kiểm tra buổi học có đang mở điểm danh hay không.
- Ghi dữ liệu điểm danh vào bảng `diem_danh`.

Ví dụ:

```bash
python recognize_and_log.py --camera-url http://192.168.1.10:4747/video --id-buoi 15 --min-score 0.60 --cooldown 20
```

## 6. Backend

Backend được xây dựng bằng Node.js và Express.js, có nhiệm vụ cung cấp API cho frontend, xử lý nghiệp vụ hệ thống, kết nối PostgreSQL và gọi các script Python để xử lý nhận diện khuôn mặt.

### 6.1. Các nhóm API chính

#### Auth API

```txt
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

Chức năng:

- Đăng ký tài khoản.
- Đăng nhập.
- Lấy thông tin người dùng hiện tại.
- Sinh JWT token.
- Kiểm tra tài khoản đang hoạt động hay bị khóa.

#### Admin API

```txt
GET    /api/admin/lookups/khoa
GET    /api/admin/lookups/lop-sv
GET    /api/admin/lookups/sinh-vien
GET    /api/admin/lookups/giang-vien
GET    /api/admin/lookups/mon-hoc
```

```txt
GET    /api/admin/tai-khoan
POST   /api/admin/tai-khoan/admin
POST   /api/admin/tai-khoan/sinh-vien/:ma_sv
POST   /api/admin/tai-khoan/giang-vien/:ma_gv
PUT    /api/admin/tai-khoan/:id/status
PUT    /api/admin/tai-khoan/:id/password
DELETE /api/admin/tai-khoan/:id
```

```txt
GET    /api/admin/sinh-vien
POST   /api/admin/sinh-vien
PUT    /api/admin/sinh-vien/:ma_sv
DELETE /api/admin/sinh-vien/:ma_sv
```

```txt
GET    /api/admin/giang-vien
POST   /api/admin/giang-vien
PUT    /api/admin/giang-vien/:ma_gv
DELETE /api/admin/giang-vien/:ma_gv
```

```txt
GET    /api/admin/mon-hoc
POST   /api/admin/mon-hoc
PUT    /api/admin/mon-hoc/:ma_mon
DELETE /api/admin/mon-hoc/:ma_mon
```

```txt
GET    /api/admin/lop-hoc-phan
POST   /api/admin/lop-hoc-phan
PUT    /api/admin/lop-hoc-phan/:ma_lop_hp
DELETE /api/admin/lop-hoc-phan/:ma_lop_hp
PUT    /api/admin/phan-cong/:ma_lop_hp
```

```txt
GET    /api/admin/lop-hoc-phan/:ma_lop_hp/sinh-vien
POST   /api/admin/lop-hoc-phan/:ma_lop_hp/sinh-vien
DELETE /api/admin/lop-hoc-phan/:ma_lop_hp/sinh-vien/:ma_sv
```

```txt
GET    /api/admin/du-lieu-khuon-mat
GET    /api/admin/du-lieu-khuon-mat/:ma_sv
POST   /api/admin/du-lieu-khuon-mat/:ma_sv/thu-thap
DELETE /api/admin/du-lieu-khuon-mat/:ma_sv
POST   /api/admin/du-lieu-khuon-mat/train
POST   /api/admin/du-lieu-khuon-mat/dong-bo
```

#### Giảng viên API

```txt
GET    /api/giang-vien/lop-hoc-phan
GET    /api/giang-vien/lop-hoc-phan/:ma_lop_hp
GET    /api/giang-vien/lop-hoc-phan/:ma_lop_hp/buoi-hoc
POST   /api/giang-vien/lop-hoc-phan/:ma_lop_hp/buoi-hoc
```

```txt
GET    /api/giang-vien/buoi-hoc/:id_buoi/diem-danh
POST   /api/giang-vien/diem-danh
PUT    /api/giang-vien/buoi-hoc/:id_buoi/trang-thai
```

```txt
POST   /api/giang-vien/diem-danh/phien-bat-dau
POST   /api/giang-vien/diem-danh/phien-ket-thuc
GET    /api/giang-vien/diem-danh/phien-hien-tai
GET    /api/giang-vien/diem-danh/phien-log
```

```txt
GET    /api/giang-vien/lich-su-diem-danh
GET    /api/giang-vien/lich-su-diem-danh/:id_buoi
```

```txt
GET    /api/giang-vien/tai-khoan
PUT    /api/giang-vien/tai-khoan
PUT    /api/giang-vien/doi-mat-khau
```

#### Assistant API

```txt
POST /api/assistant/chat
```

Chức năng:

- Nhận tin nhắn từ người dùng.
- Phân tích ý định bằng Gemini.
- Kiểm tra quyền theo vai trò.
- Kiểm tra dữ liệu còn thiếu.
- Gọi service tương ứng để thực thi.
- Trả về kết quả cho frontend hiển thị.

## 7. Frontend

Frontend được xây dựng bằng ReactJS, dùng Axios để gọi API từ backend.

### 7.1. Cấu hình API

File `Auth_api.js` cấu hình Axios với base URL:

```js
VITE_API_BASE_URL=http://localhost:8000/api
```

Nếu không có biến môi trường, hệ thống dùng mặc định:

```txt
http://localhost:8000/api
```

Token đăng nhập được lưu trong `localStorage` với key:

```txt
token
```

Khi gọi API, token sẽ được tự động gắn vào header:

```txt
Authorization: Bearer <token>
```

### 7.2. Giao diện Admin

Các trang chính:

```txt
AccountsPage.jsx
AdminDashboardPage.jsx
CourseSectionsPage.jsx
FaceDataPage.jsx
LecturersPage.jsx
StudentsPage.jsx
SubjectsPage.jsx
```

Chức năng:

- Quản lý tài khoản.
- Quản lý sinh viên.
- Quản lý giảng viên.
- Quản lý môn học.
- Quản lý lớp học phần.
- Phân công giảng viên.
- Đăng ký sinh viên vào lớp học phần.
- Quản lý dữ liệu khuôn mặt.
- Train và đồng bộ dữ liệu khuôn mặt.

### 7.3. Giao diện Giảng viên

Các trang chính:

```txt
GiangVienDashboard.jsx
LopHocPhanPage.jsx
ClassDetailPage.jsx
DiemDanhPage.jsx
AttendanceTodayPage.jsx
LichSuDiemDanhPage.jsx
ProfilePage.jsx
```

Chức năng:

- Xem dashboard giảng viên.
- Xem lớp học phần được phân công.
- Xem chi tiết lớp học phần.
- Tạo buổi học.
- Điểm danh thủ công.
- Điểm danh bằng nhận diện khuôn mặt.
- Xem lịch sử điểm danh.
- Cập nhật hồ sơ cá nhân.
- Đổi mật khẩu.

### 7.4. Chatbot

Component:

```txt
AssistantChatBox.jsx
```

Chức năng:

- Cho phép admin và giảng viên nhập yêu cầu bằng tiếng Việt.
- Gửi yêu cầu đến API `/assistant/chat`.
- Hiển thị kết quả trả về từ backend.
- Hỗ trợ thao tác nhanh trong hệ thống.

## 8. Cơ sở dữ liệu

Hệ thống sử dụng PostgreSQL.

Các bảng chính:

```txt
khoa
lop_sv
sinh_vien
giang_vien
mon_hoc
lop_hoc_phan
dang_ky_lop_hoc
buoi_hoc
diem_danh
tai_khoan
du_lieu_khuon_mat
```

### 8.1. Vai trò của các bảng

| Bảng | Mô tả |
|---|---|
| `khoa` | Lưu thông tin khoa |
| `lop_sv` | Lưu thông tin lớp sinh viên |
| `sinh_vien` | Lưu thông tin sinh viên |
| `giang_vien` | Lưu thông tin giảng viên |
| `mon_hoc` | Lưu thông tin môn học |
| `lop_hoc_phan` | Lưu thông tin lớp học phần |
| `dang_ky_lop_hoc` | Lưu thông tin sinh viên đăng ký lớp học phần |
| `buoi_hoc` | Lưu thông tin từng buổi học |
| `diem_danh` | Lưu kết quả điểm danh |
| `tai_khoan` | Lưu tài khoản đăng nhập |
| `du_lieu_khuon_mat` | Lưu thông tin dữ liệu khuôn mặt sinh viên |

## 9. Cài đặt và chạy dự án

### 9.1. Yêu cầu môi trường

Cần cài đặt:

- Node.js
- npm
- Python
- PostgreSQL
- Camera máy tính hoặc DroidCam
- Git

Khuyến nghị:

```txt
Node.js >= 18
Python >= 3.9
PostgreSQL >= 13
```

## 10. Cài đặt Backend

Di chuyển vào thư mục backend:

```bash
cd backend
```

Cài đặt thư viện:

```bash
npm install
```

Tạo file `.env`:

```bash
cp .env.example .env
```

Hoặc tự tạo file `.env` với nội dung mẫu:

```env
PORT=8000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_NAME=diemdanh_sv
DB_SSL=false

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

PYTHON_BIN=python
PYTHON_DIR=../AI-Face-ID
PYTHON_SCRIPT=recognize_and_log.py

DATASET_DIR=dataset
DB_FILE=face_db.npz

APP_TIMEZONE=Asia/Ho_Chi_Minh
MIN_FACE_SIMILARITY=0.60
ATTENDANCE_COOLDOWN_SECONDS=20
FACE_PROCESS_EVERY=3
FACE_RESIZE_SCALE=0.5

PYTHONUNBUFFERED=1
PYTHONIOENCODING=utf-8
PYTHONUTF8=1
```

Chạy backend ở môi trường development:

```bash
npm run dev
```

Hoặc chạy production:

```bash
npm start
```

Backend sẽ chạy tại:

```txt
http://localhost:8000
```

Kiểm tra API:

```txt
http://localhost:8000/
```

Nếu chạy thành công, hệ thống trả về:

```json
{
  "success": true,
  "message": "Student Attendance API is running"
}
```

## 11. Cài đặt AI-Face-ID

Di chuyển vào thư mục AI:

```bash
cd AI-Face-ID
```

Tạo môi trường ảo Python:

```bash
python -m venv .venv
```

Kích hoạt môi trường ảo trên Windows:

```bash
.venv\Scripts\activate
```

Kích hoạt môi trường ảo trên macOS/Linux:

```bash
source .venv/bin/activate
```

Cài đặt thư viện cần thiết:

```bash
pip install opencv-python numpy insightface onnxruntime psycopg2-binary
```

### 11.1. Thu thập dữ liệu khuôn mặt

Ví dụ thu thập dữ liệu cho sinh viên `SV001`:

```bash
python collect_data_cli.py --person-id SV001 --camera-url http://192.168.1.10:4747/video --max-images 80
```

Nếu dùng camera mặc định của laptop, có thể thử:

```bash
python collect_data_cli.py --person-id SV001 --camera-url 0 --max-images 80
```

Sau khi thu thập, ảnh sẽ được lưu vào:

```txt
AI-Face-ID/dataset/SV001/
```

### 11.2. Train dữ liệu khuôn mặt

Sau khi đã có dữ liệu khuôn mặt trong thư mục `dataset`, chạy:

```bash
python train_face_db.py
```

Sau khi train thành công, hệ thống tạo file:

```txt
AI-Face-ID/face_db.npz
```

### 11.3. Nhận diện và ghi điểm danh

Ví dụ nhận diện cho buổi học có `id_buoi = 15`:

```bash
python recognize_and_log.py --camera-url http://192.168.1.10:4747/video --id-buoi 15 --min-score 0.60 --cooldown 20
```

Điều kiện để nhận diện và ghi điểm danh thành công:

- File `face_db.npz` đã được tạo.
- Sinh viên đã có dữ liệu khuôn mặt.
- Sinh viên đã được đăng ký vào lớp học phần.
- Buổi học đang có trạng thái `dang_dien_ra`.
- Camera hoạt động bình thường.
- Backend và PostgreSQL đã cấu hình đúng.

## 12. Cài đặt Frontend

Di chuyển vào thư mục frontend:

```bash
cd frontend
```

Cài đặt thư viện:

```bash
npm install
```

Tạo file `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Chạy frontend:

```bash
npm run dev
```

Frontend sẽ chạy tại:

```txt
http://localhost:5173
```

## 13. Luồng hoạt động của hệ thống

### 13.1. Luồng thiết lập dữ liệu ban đầu

```txt
Admin đăng nhập
        ↓
Tạo khoa, lớp sinh viên, sinh viên
        ↓
Tạo giảng viên
        ↓
Tạo môn học
        ↓
Tạo lớp học phần
        ↓
Phân công giảng viên cho lớp học phần
        ↓
Đăng ký sinh viên vào lớp học phần
        ↓
Thu thập dữ liệu khuôn mặt sinh viên
        ↓
Train dữ liệu khuôn mặt
```

### 13.2. Luồng điểm danh bằng nhận diện khuôn mặt

```txt
Giảng viên đăng nhập
        ↓
Chọn lớp học phần
        ↓
Tạo buổi học
        ↓
Mở điểm danh
        ↓
Bắt đầu phiên điểm danh bằng camera
        ↓
Python nhận diện khuôn mặt realtime
        ↓
Kiểm tra sinh viên có thuộc lớp học phần không
        ↓
Ghi kết quả vào bảng diem_danh
        ↓
Frontend hiển thị kết quả điểm danh
        ↓
Giảng viên kết thúc phiên điểm danh
```

### 13.3. Luồng chatbot AI

```txt
Người dùng nhập yêu cầu
        ↓
Frontend gửi message đến /api/assistant/chat
        ↓
Backend gửi context và message cho Gemini
        ↓
Gemini phân tích intent và trả action
        ↓
Backend kiểm tra quyền và dữ liệu thiếu
        ↓
Backend gọi AdminService hoặc GiangVienService
        ↓
Trả kết quả về frontend
        ↓
Frontend hiển thị phản hồi cho người dùng
```

## 14. Một số trạng thái trong hệ thống

### 14.1. Trạng thái buổi học

| Trạng thái | Ý nghĩa |
|---|---|
| `chua_dien_ra` | Buổi học chưa diễn ra |
| `dang_dien_ra` | Buổi học đang mở điểm danh |
| `da_ket_thuc` | Buổi học đã kết thúc |
| `da_huy` | Buổi học đã hủy |

### 14.2. Trạng thái điểm danh

| Trạng thái | Ý nghĩa |
|---|---|
| `co_mat` | Sinh viên có mặt |
| `di_muon` | Sinh viên đi muộn |
| `vang` | Sinh viên vắng |
| `vang_co_phep` | Sinh viên vắng có phép |

### 14.3. Phương thức điểm danh

| Phương thức | Ý nghĩa |
|---|---|
| `he_thong` | Điểm danh tự động bằng nhận diện khuôn mặt |
| `thu_cong` | Giảng viên điểm danh thủ công |

### 14.4. Trạng thái tài khoản

| Trạng thái | Ý nghĩa |
|---|---|
| `hoat_dong` | Tài khoản đang hoạt động |
| `khoa` | Tài khoản bị khóa |

## 15. Tài khoản và phân quyền

Hệ thống sử dụng JWT để xác thực người dùng.

Sau khi đăng nhập thành công, backend trả về token. Frontend lưu token vào `localStorage` và tự động gửi token trong các request tiếp theo.

Các vai trò chính:

| Vai trò | Quyền |
|---|---|
| `admin` | Quản lý toàn bộ hệ thống |
| `giang_vien` | Quản lý lớp học phần được phân công và điểm danh |
| `sinh_vien` | Có tài khoản trong hệ thống, có thể mở rộng chức năng sau |

## 16. Gợi ý sử dụng DroidCam

Nếu sử dụng điện thoại làm camera:

1. Cài ứng dụng DroidCam trên điện thoại.
2. Kết nối điện thoại và máy tính cùng mạng Wi-Fi.
3. Mở DroidCam trên điện thoại.
4. Lấy URL camera, ví dụ:

```txt
http://192.168.1.10:4747/video
```

5. Nhập URL này vào giao diện thu thập dữ liệu hoặc điểm danh.

## 17. Lỗi thường gặp và cách xử lý

### 17.1. Không kết nối được PostgreSQL

Kiểm tra lại file `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_NAME=diemdanh_sv
```

Đảm bảo PostgreSQL đang chạy và database đã được tạo.

### 17.2. Token không hợp lệ hoặc hết hạn

Cách xử lý:

- Đăng xuất.
- Đăng nhập lại.
- Kiểm tra `JWT_SECRET` trong backend.
- Kiểm tra frontend có lưu token đúng key `token` không.

### 17.3. Không mở được camera

Cách xử lý:

- Kiểm tra camera có đang bị ứng dụng khác sử dụng không.
- Kiểm tra URL DroidCam có đúng không.
- Kiểm tra điện thoại và máy tính có cùng mạng không.
- Thử mở URL camera trên trình duyệt.

### 17.4. Không tìm thấy file face_db.npz

Nguyên nhân:

- Chưa train dữ liệu khuôn mặt.

Cách xử lý:

```bash
cd AI-Face-ID
python train_face_db.py
```

### 17.5. Sinh viên không được ghi điểm danh

Kiểm tra:

- Sinh viên đã có dữ liệu khuôn mặt chưa.
- Sinh viên đã được đăng ký vào lớp học phần chưa.
- Buổi học có trạng thái `dang_dien_ra` chưa.
- Độ tương đồng khuôn mặt có đạt ngưỡng `MIN_FACE_SIMILARITY` không.

### 17.6. Chatbot không phản hồi

Kiểm tra:

- Đã cấu hình `GEMINI_API_KEY` trong `.env` chưa.
- Backend có đang chạy không.
- Token đăng nhập còn hợp lệ không.
- Người dùng có vai trò `admin` hoặc `giang_vien` không.

## 18. Lệnh chạy nhanh toàn bộ hệ thống

### 18.1. Chạy backend

```bash
cd backend
npm run dev
```

### 18.2. Chạy frontend

```bash
cd frontend
npm run dev
```

### 18.3. Train dữ liệu khuôn mặt

```bash
cd AI-Face-ID
python train_face_db.py
```

### 18.4. Chạy nhận diện thủ công bằng terminal

```bash
cd AI-Face-ID
python recognize_and_log.py --camera-url http://192.168.1.10:4747/video --id-buoi 15
```

## 19. Hướng phát triển tiếp theo

- Xây dựng giao diện dành cho sinh viên.
- Cho phép sinh viên xem lịch sử điểm danh cá nhân.
- Xuất báo cáo điểm danh ra Excel hoặc PDF.
- Gửi thông báo khi sinh viên vắng quá số buổi quy định.
- Tối ưu tốc độ nhận diện khuôn mặt.
- Thêm chức năng điểm danh nhiều camera.
- Triển khai hệ thống lên server thật.
- Phân quyền chi tiết hơn cho từng nhóm người dùng.
- Bổ sung thống kê tỷ lệ chuyên cần theo môn học, lớp học phần và sinh viên.

## 20. Tác giả

Đề tài: **Hệ thống điểm danh sinh viên bằng nhận diện khuôn mặt**

Mục tiêu: Xây dựng hệ thống hỗ trợ quản lý điểm danh tự động, giảm thao tác thủ công cho giảng viên, tăng tính chính xác và hiện đại hóa quy trình quản lý lớp học.
