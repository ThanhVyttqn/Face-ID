import os
import cv2
import numpy as np
from insightface.app import FaceAnalysis

DATASET_DIR = "dataset"
DB_FILE = "face_db.npz"


def get_face_app():
    app = FaceAnalysis(providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=0, det_size=(640, 640))
    return app


def l2_normalize(vec):
    norm = np.linalg.norm(vec)
    if norm == 0:
        return vec
    return vec / norm


def enlarge_if_small(img, min_size=400):
    h, w = img.shape[:2]
    if w >= min_size and h >= min_size:
        return img

    scale = max(min_size / w, min_size / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    return cv2.resize(img, (new_w, new_h))


def load_db():
    if not os.path.exists(DB_FILE):
        return {}, {}

    data = np.load(DB_FILE, allow_pickle=True)

    names = data["names"].tolist() if "names" in data else []
    embeddings = data["embeddings"] if "embeddings" in data else np.array([])
    counts = data["counts"].tolist() if "counts" in data else [0] * len(names)

    emb_dict = {}
    count_dict = {}

    for i, name in enumerate(names):
        emb_dict[name] = embeddings[i]
        count_dict[name] = counts[i] if i < len(counts) else 0

    return emb_dict, count_dict


def save_db(emb_dict, count_dict):
    names = sorted(emb_dict.keys())
    embeddings = np.array([emb_dict[name] for name in names], dtype=np.float32)
    counts = np.array([count_dict.get(name, 0) for name in names], dtype=np.int32)

    np.savez(
        DB_FILE,
        names=np.array(names),
        embeddings=embeddings,
        counts=counts
    )


def extract_embedding(app, img_path, filename=None):
    img = cv2.imread(img_path)

    if img is None:
        print(f"  [Bỏ qua] Không đọc được ảnh: {filename or os.path.basename(img_path)}")
        return None

    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

    img = enlarge_if_small(img, min_size=400)

    faces = app.get(img)

    if len(faces) == 0:
        print(f"  [Bỏ qua] Không tìm thấy mặt: {filename or os.path.basename(img_path)}")
        return None

    faces = sorted(
        faces,
        key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
        reverse=True
    )

    face = faces[0]
    return face.normed_embedding.astype(np.float32)


def get_current_people():
    if not os.path.exists(DATASET_DIR):
        return []

    return sorted(
        [d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))]
    )


def build_face_database():
    if not os.path.exists(DATASET_DIR):
        print(f"Không tìm thấy thư mục: {DATASET_DIR}")
        return

    app = get_face_app()
    emb_dict, count_dict = load_db()

    person_dirs = get_current_people()

    if not person_dirs:
        print("Không có thư mục người dùng nào trong dataset.")
        return

    current_people = set(person_dirs)

    # Xóa người không còn trong dataset
    emb_dict = {k: v for k, v in emb_dict.items() if k in current_people}
    count_dict = {k: v for k, v in count_dict.items() if k in current_people}

    any_change = False

    for person_name in person_dirs:
        person_path = os.path.join(DATASET_DIR, person_name)

        # Nếu tên thư mục đã có trong DB thì bỏ qua toàn bộ thư mục
        if person_name in emb_dict:
            print(f"\nĐang xử lý: {person_name}")
            print("  -> Thư mục này đã có trong database, bỏ qua.")
            continue

        print(f"\nĐang xử lý: {person_name}")

        person_embeds = []

        for filename in sorted(os.listdir(person_path)):
            if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
                continue

            img_path = os.path.join(person_path, filename)
            emb = extract_embedding(app, img_path, filename)

            if emb is not None:
                person_embeds.append(emb)

        if len(person_embeds) == 0:
            print(f"  [Cảnh báo] Không có ảnh hợp lệ cho {person_name}")
            continue

        mean_emb = np.mean(person_embeds, axis=0)
        mean_emb = l2_normalize(mean_emb).astype(np.float32)

        emb_dict[person_name] = mean_emb
        count_dict[person_name] = len(person_embeds)
        any_change = True

        print(f"  -> Có {len(person_embeds)} ảnh hợp lệ cho {person_name}")
        print(f"  -> Đã tạo 1 embedding đại diện cho {person_name}")

    if len(emb_dict) == 0:
        print("Không tạo được cơ sở dữ liệu khuôn mặt.")
        return

    save_db(emb_dict, count_dict)

    if any_change:
        print(f"\nHoàn tất. Đã cập nhật database vào: {DB_FILE}")
    else:
        print(f"\nKhông có người mới. Database giữ nguyên: {DB_FILE}")

    print("\n=== TÓM TẮT DATABASE HIỆN TẠI ===")
    for name in sorted(count_dict.keys()):
        print(f"{name}: {count_dict[name]} ảnh hợp lệ")


if __name__ == "__main__":
    build_face_database()