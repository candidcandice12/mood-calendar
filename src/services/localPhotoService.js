const DB_NAME = "moodCalendarPhotos";
const STORE_NAME = "photos";
const DB_VERSION = 1;

export async function saveLocalPhoto(photoId, dataUrl) {
  if (!photoId || !dataUrl?.startsWith("data:")) {
    return "";
  }

  const db = await openPhotoDb();
  await runPhotoTransaction(db, "readwrite", (store) => store.put({ id: photoId, dataUrl, updatedAt: Date.now() }));
  db.close();
  return photoId;
}

export async function loadLocalPhoto(photoId) {
  if (!photoId) {
    return "";
  }

  const db = await openPhotoDb();
  const photo = await runPhotoTransaction(db, "readonly", (store) => store.get(photoId));
  db.close();
  return photo?.dataUrl || "";
}

export async function deleteLocalPhoto(photoId) {
  if (!photoId) {
    return;
  }

  const db = await openPhotoDb();
  await runPhotoTransaction(db, "readwrite", (store) => store.delete(photoId));
  db.close();
}

export function getLocalPhotoId(userName, date) {
  return `${encodeURIComponent(userName)}__${date}`;
}

function openPhotoDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.addEventListener("upgradeneeded", () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    });

    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error || new Error("사진 저장소를 열지 못했어요.")));
  });
}

function runPhotoTransaction(db, mode, action) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = action(store);
    let result;

    request.addEventListener("success", () => {
      result = request.result;
    });
    request.addEventListener("error", () => reject(request.error || new Error("사진 저장 중 문제가 있었어요.")));
    transaction.addEventListener("complete", () => resolve(result));
    transaction.addEventListener("error", () => reject(transaction.error || new Error("사진 저장 중 문제가 있었어요.")));
  });
}
