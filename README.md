# HỆ THỐNG ĐIỂM DANH SINH VIÊN BẰNG NHẬN DIỆN KHUÔN MẶT

## 1. Giới thiệu

Đây là hệ thống điểm danh sinh viên sử dụng nhận diện khuôn mặt, hỗ trợ quản trị viên và giảng viên quản lý sinh viên, giảng viên, môn học, lớp học phần, buổi học và dữ liệu điểm danh.

Hệ thống gồm 3 phần chính:

- **Frontend**: giao diện ReactJS cho Admin và Giảng viên.
- **Backend**: API Node.js/Express kết nối PostgreSQL.
- **AI-Face-ID**: xử lý thu thập, huấn luyện và nhận diện khuôn mặt bằng Python.

Ngoài ra, hệ thống tích hợp **trợ lý AI chatbot** để hỗ trợ admin và giảng viên thao tác nhanh bằng tiếng Việt.

---

## 2. Chức năng chính

### Admin

- Đăng nhập hệ thống.
- Quản lý tài khoản admin, giảng viên, sinh viên.
- Quản lý sinh viên, giảng viên, môn học.
- Quản lý lớp học phần.
- Phân công giảng viên cho lớp học phần.
- Đăng ký sinh viên vào lớp học phần.
- Quản lý dữ liệu khuôn mặt sinh viên.
- Thu thập, xóa, đồng bộ và train dữ liệu khuôn mặt.
- Sử dụng chatbot AI để thao tác nhanh.

### Giảng viên

- Đăng nhập hệ thống.
- Xem lớp học phần được phân công.
- Xem chi tiết lớp học phần và danh sách sinh viên.
- Tạo buổi học.
- Mở/kết thúc điểm danh.
- Điểm danh thủ công.
- Điểm danh tự động bằng nhận diện khuôn mặt.
- Theo dõi điểm danh realtime.
- Xem lịch sử điểm danh.
- Cập nhật thông tin cá nhân và đổi mật khẩu.
- Sử dụng chatbot AI để hỗ trợ thao tác.

### Nhận diện khuôn mặt

- Thu thập ảnh khuôn mặt từ camera hoặc DroidCam.
- Lưu ảnh theo từng mã sinh viên trong thư mục `dataset`.
- Train dữ liệu khuôn mặt bằng InsightFace.
- Tạo file `face_db.npz`.
- Nhận diện khuôn mặt realtime.
- Kiểm tra sinh viên có thuộc lớp học phần hay không.
- Ghi kết quả điểm danh vào PostgreSQL.

---

## 3. Công nghệ sử dụng

### Frontend

- ReactJS
- Vite
- Axios
- React Router
- CSS

### Backend

- Node.js
- Express.js
- PostgreSQL
- JWT
- bcrypt / bcryptjs
- express-validator
- Google Gemini API

### AI nhận diện khuôn mặt

- Python
- OpenCV
- InsightFace
- NumPy
- psycopg2

---

## 4. Cấu trúc thư mục

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
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validation/
│   │   └── app.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── pages/
    │   │   ├── admin/
    │   │   └── giang-vien/
    │   └── App.jsx
    ├── .env
    └── package.json
```

---

## 5. Mô tả các thành phần chính

### AI-Face-ID

| File | Chức năng |
|---|---|
| `collect_data_cli.py` | Thu thập ảnh khuôn mặt sinh viên từ camera |
| `train_face_db.py` | Train dữ liệu khuôn mặt và tạo `face_db.npz` |
| `recognize_and_log.py` | Nhận diện khuôn mặt realtime và ghi điểm danh |

### Backend

Backend xử lý API, xác thực, phân quyền, nghiệp vụ hệ thống và kết nối cơ sở dữ liệu.

Các nhóm chính:

- `controllers/`: nhận request và trả response.
- `routes/`: định nghĩa các tuyến API.
- `services/`: xử lý nghiệp vụ.
- `models/`: truy vấn PostgreSQL.
- `middleware/`: xác thực JWT, phân quyền, validate dữ liệu.
- `utils/`: JWT, password, response helper.

### Frontend

Frontend cung cấp giao diện cho:

- Admin quản lý dữ liệu hệ thống.
- Giảng viên quản lý lớp học phần và điểm danh.
- Chatbot hỗ trợ thao tác bằng ngôn ngữ tự nhiên.

---

## 6. Cơ sở dữ liệu

Hệ thống sử dụng PostgreSQL với các bảng chính:

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

---

## 7. Cài đặt Backend

Di chuyển vào thư mục backend:

```bash
cd backend
```

Cài đặt thư viện:

```bash
npm install
```

Tạo file `.env`:

```env
PORT=8000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=diemdanh_sv
DB_SSL=false

JWT_SECRET=your_jwt_secret
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
```

Chạy backend:

```bash
npm run dev
```

Backend chạy tại:

```txt
http://localhost:8000
```

---

## 8. Cài đặt Frontend

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

Frontend chạy tại:

```txt
http://localhost:5173
```

---

## 9. Cài đặt AI-Face-ID

Di chuyển vào thư mục AI:

```bash
cd AI-Face-ID
```

Tạo môi trường ảo:

```bash
python -m venv .venv
```

Kích hoạt môi trường ảo trên Windows:

```bash
.venv\Scripts\activate
```

Cài thư viện:

```bash
pip install opencv-python numpy insightface onnxruntime psycopg2-binary
```

---

## 10. Cách sử dụng AI nhận diện khuôn mặt

### Thu thập dữ liệu khuôn mặt

```bash
python collect_data_cli.py --person-id SV001 --camera-url http://192.168.1.10:4747/video --max-images 80
```

Dữ liệu được lưu tại:

```txt
AI-Face-ID/dataset/SV001/
```

### Train dữ liệu khuôn mặt

```bash
python train_face_db.py
```

Sau khi train, hệ thống tạo file:

```txt
face_db.npz
```

### Nhận diện và ghi điểm danh

```bash
python recognize_and_log.py --camera-url http://192.168.1.10:4747/video --id-buoi 15 --min-score 0.60 --cooldown 20
```

---

## 11. Luồng hoạt động chính

### Luồng thiết lập ban đầu

```txt
Admin đăng nhập
→ Tạo sinh viên, giảng viên, môn học
→ Tạo lớp học phần
→ Phân công giảng viên
→ Đăng ký sinh viên vào lớp học phần
→ Thu thập dữ liệu khuôn mặt
→ Train dữ liệu khuôn mặt
```

### Luồng điểm danh

```txt
Giảng viên đăng nhập
→ Chọn lớp học phần
→ Tạo buổi học
→ Mở điểm danh
→ Bắt đầu nhận diện khuôn mặt
→ Hệ thống nhận diện sinh viên
→ Ghi kết quả vào bảng diem_danh
→ Giảng viên kết thúc điểm danh
```

### Luồng chatbot AI

```txt
Người dùng nhập yêu cầu
→ Frontend gửi tin nhắn đến /api/assistant/chat
→ Backend gửi yêu cầu cho Gemini
→ Gemini phân tích action
→ Backend kiểm tra quyền và dữ liệu
→ Thực thi chức năng
→ Trả kết quả về frontend
```

---

## 12. Một số trạng thái sử dụng trong hệ thống

### Trạng thái buổi học

| Trạng thái | Ý nghĩa |
|---|---|
| `chua_dien_ra` | Chưa diễn ra |
| `dang_dien_ra` | Đang mở điểm danh |
| `da_ket_thuc` | Đã kết thúc |

### Trạng thái điểm danh

| Trạng thái | Ý nghĩa |
|---|---|
| `co_mat` | Có mặt |
| `di_muon` | Đi muộn |
| `vang` | Vắng |

### Phương thức điểm danh

| Phương thức | Ý nghĩa |
|---|---|
| `he_thong` | Điểm danh bằng nhận diện khuôn mặt |
| `thu_cong` | Điểm danh thủ công |

---

## 13. Lưu ý khi sử dụng

- Phải tạo database PostgreSQL trước khi chạy backend.
- Phải cấu hình đúng file `.env`.
- Phải train dữ liệu khuôn mặt trước khi nhận diện.
- Sinh viên phải được đăng ký vào lớp học phần thì mới được ghi điểm danh.
- Buổi học phải ở trạng thái `dang_dien_ra` thì hệ thống mới ghi nhận điểm danh.
- Không đưa file `.env` thật lên GitHub vì có thể chứa mật khẩu và API key.

---

## 14. Lệnh chạy nhanh

Chạy backend:

```bash
cd backend
npm start
```

Chạy frontend:

```bash
cd frontend
npm run dev
```

Train khuôn mặt:

```bash
cd AI-Face-ID
python train_face_db.py
```

Nhận diện thủ công:

```bash
cd AI-Face-ID
python recognize_and_log.py --camera-url http://192.168.1.10:4747/video --id-buoi 15
```

---

## 15. Hướng phát triển

- Thêm giao diện dành cho sinh viên.
- Gửi cảnh báo khi sinh viên vắng nhiều.
- Tối ưu tốc độ nhận diện khuôn mặt.
- Hỗ trợ nhiều camera.
- Triển khai hệ thống lên server thật.

---

## 16. Tác giả

Đề tài: **Hệ thống điểm danh sinh viên bằng nhận diện khuôn mặt**

Mục tiêu: Xây dựng hệ thống hỗ trợ điểm danh tự động, giảm thao tác thủ công cho giảng viên và nâng cao hiệu quả quản lý lớp học.