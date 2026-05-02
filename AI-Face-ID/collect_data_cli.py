import argparse
import os
import time
import sys
import cv2

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def is_blurry(img, threshold=80):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    score = cv2.Laplacian(gray, cv2.CV_64F).var()
    return score < threshold


def collect_images(person_id, camera_url, max_images=80, dataset_dir='dataset'):
    cap = cv2.VideoCapture(camera_url)

    if not cap.isOpened():
        raise RuntimeError('Khong mo duoc stream tu camera/DroidCam.')

    ret, frame = cap.read()
    if not ret:
        cap.release()
        raise RuntimeError('Khong doc duoc frame dau tien tu camera.')

    window_name = f'Thu thap du lieu - {person_id}'
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.imshow(window_name, frame)
    cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)

    person_dir = os.path.join(dataset_dir, person_id)
    os.makedirs(person_dir, exist_ok=True)

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )

    if face_cascade.empty():
        cap.release()
        cv2.destroyAllWindows()
        raise RuntimeError('Khong load duoc haarcascade_frontalface_default.xml')

    existing = [
        f for f in os.listdir(person_dir)
        if f.lower().endswith(('.jpg', '.jpeg', '.png'))
    ]
    count = len(existing)
    last_capture_time = 0
    capture_interval = 1.2

    print(f'Bat dau thu thap du lieu cho {person_id}. Nhan q de dung.')

    while True:
        ret, frame = cap.read()
        if not ret:
            print('Khong nhan duoc khung hinh tu camera.')
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(100, 100)
        )

        if len(faces) > 0:
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            x, y, w, h = faces[0]
            cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)

            current_time = time.time()
            if current_time - last_capture_time >= capture_interval:
                pad_x = int(w * 0.25)
                pad_top = int(h * 0.35)
                pad_bottom = int(h * 0.20)

                x1 = max(0, x - pad_x)
                y1 = max(0, y - pad_top)
                x2 = min(frame.shape[1], x + w + pad_x)
                y2 = min(frame.shape[0], y + h + pad_bottom)

                face_crop = frame[y1:y2, x1:x2]

                if face_crop.size > 0 and not is_blurry(face_crop):
                    img_path = os.path.join(person_dir, f'face_{count:03d}.jpg')
                    cv2.imwrite(img_path, face_crop)
                    count += 1
                    last_capture_time = current_time
                    print(f'Da luu anh {count}: {img_path}')

                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        cv2.putText(
            frame,
            f'So anh da chup: {count}/{max_images}',
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2
        )

        cv2.imshow(window_name, frame)

        if cv2.waitKey(1) & 0xFF == ord('q') or count >= max_images:
            break

    cap.release()
    cv2.destroyAllWindows()
    print('Hoan tat thu thap du lieu.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--person-id', required=True)
    parser.add_argument('--camera-url', required=True)
    parser.add_argument('--max-images', type=int, default=80)
    parser.add_argument('--dataset-dir', default='dataset')
    args = parser.parse_args()

    collect_images(args.person_id, args.camera_url, args.max_images, args.dataset_dir)