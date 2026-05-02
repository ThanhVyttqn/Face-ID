import numpy as np

data = np.load("face_db.npz", allow_pickle=True)

print("Các key trong file:", data.files)

print("\nNames:")
print(data["names"])

print("\nEmbeddings:")
print(data["embeddings"])

print("\nCounts:")
print(data["counts"])