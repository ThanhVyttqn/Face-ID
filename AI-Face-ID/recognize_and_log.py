import argparse
import os
import threading
import time
from datetime import datetime

import cv2
import numpy as np
import psycopg2
from insightface.app import FaceAnalysis

try:
    from zoneinfo import ZoneInfo
except Exception:
    ZoneInfo = None

print("=== PYTHON FILE STARTED ===")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SIM_THRESHOLD = float(os.getenv('MIN_FACE_SIMILARITY', '0.60'))
ATTENDANCE_COOLDOWN_SECONDS = int(os.getenv('ATTENDANCE_COOLDOWN_SECONDS', '20'))
PROCESS_EVERY = int(os.getenv('FACE_PROCESS_EVERY', '3'))
RESIZE_SCALE = float(os.getenv('FACE_RESIZE_SCALE', '0.5'))
APP_TIMEZONE = os.getenv('APP_TIMEZONE', 'Asia/Ho_Chi_Minh')


def normalize_env_path(value, default_name):
    raw = (value or default_name).strip().strip('"').strip("'")
    if os.path.isabs(raw):
        return raw
    return os.path.join(SCRIPT_DIR, raw)


DB_FILE = normalize_env_path(os.getenv('DB_FILE'), 'face_db.npz')


class CameraStream:
    def __init__(self, src):
        self.src = src
        self.cap = cv2.VideoCapture(src)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        if not self.cap.isOpened():
            raise RuntimeError('Không mở được stream từ camera/DroidCam.')

        self.lock = threading.Lock()
        self.frame = None
        self.running = True

        self.thread = threading.Thread(target=self._update, daemon=True)
        self.thread.start()

        start_wait = time.time()
        while self.frame is None and time.time() - start_wait < 5:
            time.sleep(0.01)

        if self.frame is None:
            self.release()
            raise RuntimeError('Không nhận được frame đầu tiên từ camera/DroidCam.')

    def _update(self):
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                time.sleep(0.01)
                continue

            with self.lock:
                self.frame = frame

    def read(self):
        with self.lock:
            if self.frame is None:
                return False, None
            return True, self.frame.copy()

    def release(self):
        self.running = False
        if hasattr(self, 'thread') and self.thread.is_alive():
            self.thread.join(timeout=1.0)
        if hasattr(self, 'cap') and self.cap:
            self.cap.release()


def get_local_now():
    if ZoneInfo is None:
        return datetime.now()

    try:
        return datetime.now(ZoneInfo(APP_TIMEZONE))
    except Exception:
        return datetime.now()

# Khởi tạo InsightFace với mô hình ArcFace

def get_face_app(det_size=(320, 320)):
    app = FaceAnalysis(providers=['CPUExecutionProvider'])
    app.prepare(ctx_id=0, det_size=det_size)
    return app

# Tải cơ sở dữ liệu từ file face_db.npz

def load_face_db(db_file=DB_FILE):
    if not os.path.exists(db_file):
        raise FileNotFoundError(f'Không tìm thấy {db_file}. Hãy train trước.')

    data = np.load(db_file, allow_pickle=True)
    names = data['names']
    embeddings = data['embeddings'].astype(np.float32)

    if len(names) == 0 or len(embeddings) == 0:
        raise RuntimeError('face_db.npz không có dữ liệu.')

    return names, embeddings

# tính độ tương đồng giữa 2 vector đặc trưng
def cosine_similarity(query_embedding, known_embeddings):
    return np.dot(known_embeddings, query_embedding)


def get_pg_connection():
    return psycopg2.connect(
        host=os.getenv('PGHOST') or os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('PGPORT') or os.getenv('DB_PORT', '5432'),
        user=os.getenv('PGUSER') or os.getenv('DB_USER', 'postgres'),
        password=os.getenv('PGPASSWORD') or os.getenv('DB_PASSWORD', 'postgres'),
        dbname=os.getenv('PGDATABASE') or os.getenv('DB_NAME', 'diemdanh_sv'),
    )


def get_session_info(conn, id_buoi):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id_buoi, ma_lop_hp, ngay_hoc, gio_bat_dau, gio_ket_thuc, trang_thai
            FROM buoi_hoc
            WHERE id_buoi = %s
            """,
            (id_buoi,),
        )
        row = cur.fetchone()

    if not row:
        return None

    return {
        'id_buoi': row[0],
        'ma_lop_hp': row[1],
        'ngay_hoc': row[2],
        'gio_bat_dau': row[3],
        'gio_ket_thuc': row[4],
        'trang_thai': row[5],
    }


def get_student_info(conn, ma_sv):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT ma_sv, ho_ten
            FROM sinh_vien
            WHERE ma_sv = %s
            """,
            (ma_sv,),
        )
        row = cur.fetchone()

    if not row:
        return None

    return {
        'ma_sv': row[0],
        'ho_ten': row[1],
    }


def is_student_registered_in_class(conn, ma_sv, ma_lop_hp):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT 1
            FROM dang_ky_lop_hoc
            WHERE ma_sv = %s
              AND ma_lop_hp = %s
              AND trang_thai = 'da_dang_ky'
            LIMIT 1
            """,
            (ma_sv, ma_lop_hp),
        )
        return cur.fetchone() is not None


def attendance_exists(conn, id_buoi, ma_sv):
    """Trả về True nếu sinh viên đã có bản ghi điểm danh cho buổi này."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT 1
            FROM diem_danh
            WHERE id_buoi = %s AND ma_sv = %s
            LIMIT 1
            """,
            (id_buoi, ma_sv),
        )
        return cur.fetchone() is not None


def upsert_attendance(conn, id_buoi, ma_lop_hp, ma_sv, similarity, ghi_chu=None):
    local_now = get_local_now()

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO diem_danh
            (id_buoi, ma_lop_hp, ma_sv, trang_thai, thoi_gian, do_tin_cay, phuong_thuc, ghi_chu)
            VALUES (%s, %s, %s, 'co_mat', %s, %s, 'he_thong', %s)
            ON CONFLICT (id_buoi, ma_sv)
            DO UPDATE SET
                ma_lop_hp = EXCLUDED.ma_lop_hp,
                trang_thai = EXCLUDED.trang_thai,
                thoi_gian = EXCLUDED.thoi_gian,
                do_tin_cay = EXCLUDED.do_tin_cay,
                phuong_thuc = EXCLUDED.phuong_thuc,
                ghi_chu = EXCLUDED.ghi_chu
            """,
            (id_buoi, ma_lop_hp, ma_sv, local_now, float(similarity), ghi_chu),
        )
    conn.commit()


def draw_box(frame, box, label, color):
    x1, y1, x2, y2 = box
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
    cv2.putText(
        frame,
        label,
        (x1, max(y1 - 10, 20)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        color,
        2,
    )


def scale_bbox_to_original(bbox, frame_shape, small_frame_shape):
    scale_x = frame_shape[1] / small_frame_shape[1]
    scale_y = frame_shape[0] / small_frame_shape[0]

    x1 = int(bbox[0] * scale_x)
    y1 = int(bbox[1] * scale_y)
    x2 = int(bbox[2] * scale_x)
    y2 = int(bbox[3] * scale_y)

    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(frame_shape[1] - 1, x2)
    y2 = min(frame_shape[0] - 1, y2)

    return x1, y1, x2, y2


def build_unknown_result(face, frame_shape, small_frame_shape, score=0.0):
    bbox = face.bbox.astype(int)
    scaled_box = scale_bbox_to_original(bbox, frame_shape, small_frame_shape)
    return {
        'box': scaled_box,
        'display_name': 'Unknown',
        'display_score': float(score),
        'color': (0, 0, 255),
    }

# trích xuất embedding và so sánh với embedding có sẳn trong csdl
def recognize_face(
    conn,
    face,
    names,
    known_embeddings,
    frame_shape,
    small_frame_shape,
    id_buoi,
    ma_lop_hp,
    camera_url,
    sim_threshold,
    cooldown_seconds,
    last_marked_times,
):
    emb = face.normed_embedding.astype(np.float32)
    sims = cosine_similarity(emb, known_embeddings)
    best_idx = int(np.argmax(sims))
    best_score = float(sims[best_idx])

    if best_score < sim_threshold:
        return build_unknown_result(face, frame_shape, small_frame_shape, best_score)

    predicted_ma_sv = str(names[best_idx])
    bbox = face.bbox.astype(int)
    scaled_box = scale_bbox_to_original(bbox, frame_shape, small_frame_shape)
    student_info = get_student_info(conn, predicted_ma_sv)

    if not student_info:
        return {
            'box': scaled_box,
            'display_name': f'{predicted_ma_sv} - khong co trong DB',
            'display_score': best_score,
            'color': (0, 165, 255),
        }

    # class_name = get_class_name(conn, ma_lop_hp)  # Get the class name
    # if not class_name:
    #     class_name = "N/A"

    if not is_student_registered_in_class(conn, predicted_ma_sv, ma_lop_hp):
        return {
            'box': scaled_box,
            'display_name': f'{student_info["ho_ten"]} - khong thuoc {ma_lop_hp}',
            'display_score': best_score,
            'color': (0, 0, 255),
        }

    now = time.time()
    last_marked = last_marked_times.get(predicted_ma_sv, 0)
    existed = attendance_exists(conn, id_buoi, predicted_ma_sv)

    if now - last_marked >= cooldown_seconds:
        upsert_attendance(
            conn=conn,
            id_buoi=id_buoi,
            ma_lop_hp=ma_lop_hp,
            ma_sv=predicted_ma_sv,
            similarity=best_score,
            ghi_chu='Diem danh bang nhan dien khuon mat',
        )

        last_marked_times[predicted_ma_sv] = now
        action = 'cap_nhat' if existed else 'tao_moi'
        print(
            f"[OK] {student_info['ho_ten']} ({predicted_ma_sv}) "
            f"-> {ma_lop_hp} | score={best_score:.3f} | {action}"
        )

    return {
        'box': scaled_box,
        'display_name': f"{student_info['ho_ten']} ({predicted_ma_sv})",
        'display_score': best_score,
        'color': (0, 255, 0),
    }


def recognize_and_mark_attendance(camera_url, id_buoi, sim_threshold, cooldown_seconds):
    names, known_embeddings = load_face_db(DB_FILE)
    app = get_face_app()
    conn = get_pg_connection()

    session = get_session_info(conn, id_buoi)
    if not session:
        conn.close()
        raise RuntimeError(f'Không tìm thấy buổi học id_buoi={id_buoi}.')

    if session['trang_thai'] != 'dang_dien_ra':
        conn.close()
        raise RuntimeError(
            f"Buổi học id_buoi={id_buoi} chưa mở điểm danh. "
            f"Trạng thái hiện tại: {session['trang_thai']}"
        )

    ma_lop_hp = session['ma_lop_hp']
    cap = CameraStream(camera_url)

    frame_count = 0
    prev_time = time.time()
    last_results = []
    last_marked_times = {}

    print('==========================================')
    print('ĐÃ BẮT ĐẦU ĐIỂM DANH THEO BUỔI HỌC')
    print(f'id_buoi   : {id_buoi}')
    print(f'ma_lop_hp : {ma_lop_hp}')
    print(f'threshold : {sim_threshold}')
    print(f'face_db   : {DB_FILE}')
    print('Nhấn q để thoát.')
    print('==========================================')

    try:
        while True:
            if frame_count % 60 == 0:
                current_session = get_session_info(conn, id_buoi)
                if not current_session:
                    print('Buổi học không còn tồn tại. Dừng chương trình.')
                    break
                if current_session['trang_thai'] != 'dang_dien_ra':
                    print(f"Buổi học đã chuyển sang trạng thái '{current_session['trang_thai']}'. Dừng chương trình.")
                    break

            ret, frame = cap.read()
            if not ret:
                print('Không đọc được frame từ camera.')
                time.sleep(0.01)
                continue

            frame_count += 1

            if frame_count % PROCESS_EVERY == 0:
                small_frame = cv2.resize(frame, (0, 0), fx=RESIZE_SCALE, fy=RESIZE_SCALE)
                faces = app.get(small_frame)
                current_results = []

                if faces:
                    faces = sorted(
                        faces,
                        key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
                        reverse=True,
                    )

                    for face in faces:
                        result = recognize_face(
                            conn=conn,
                            face=face,
                            names=names,
                            known_embeddings=known_embeddings,
                            frame_shape=frame.shape,
                            small_frame_shape=small_frame.shape,
                            id_buoi=id_buoi,
                            ma_lop_hp=ma_lop_hp,
                            camera_url=camera_url,
                            sim_threshold=sim_threshold,
                            cooldown_seconds=cooldown_seconds,
                            last_marked_times=last_marked_times,
                        )
                        current_results.append(result)

                last_results = current_results

            for result in last_results:
                draw_box(
                    frame,
                    result['box'],
                    f"{result['display_name']} ({result['display_score']:.3f})",
                    result['color'],
                )

            cv2.putText(
                frame,
                f'Buoi hoc: {id_buoi} | Lop HP: {ma_lop_hp}',
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 0),
                2,
            )

            current_time = time.time()
            fps = 1 / max(current_time - prev_time, 1e-6)
            prev_time = current_time
            cv2.putText(
                frame,
                f'FPS: {fps:.1f} | Faces: {len(last_results)}',
                (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 255),
                2,
            )

            cv2.imshow('Face Attendance - Theo lop dang mo', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    finally:
        cap.release()
        cv2.destroyAllWindows()
        conn.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--camera-url', required=True, help='URL camera, ví dụ http://192.168.1.10:4747/video')
    parser.add_argument('--id-buoi', type=int, required=True, help='ID buoi hoc dang mo diem danh')
    parser.add_argument('--min-score', type=float, default=DEFAULT_SIM_THRESHOLD, help='Nguong similarity')
    parser.add_argument('--cooldown', type=int, default=ATTENDANCE_COOLDOWN_SECONDS, help='So giay cho moi lan ghi lai')
    args = parser.parse_args()

    recognize_and_mark_attendance(
        camera_url=args.camera_url,
        id_buoi=args.id_buoi,
        sim_threshold=args.min_score,
        cooldown_seconds=args.cooldown,
    )