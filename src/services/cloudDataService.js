import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { db, isFirebaseConfigured, signInToFirebase } from "../firebase";

export async function loadCloudState() {
  if (!isFirebaseConfigured || !db) {
    return null;
  }

  const user = await signInToFirebase();

  if (!user) {
    return null;
  }

  const appStateSnapshot = await getDoc(getAppStateRef(user.uid));
  const recordsSnapshot = await getDocs(getRecordsCollectionRef(user.uid));

  if (!appStateSnapshot.exists() && recordsSnapshot.empty) {
    return null;
  }

  const records = {};

  recordsSnapshot.forEach((recordDoc) => {
    const record = recordDoc.data();

    if (!record.userName || !record.date) return;

    records[record.userName] = records[record.userName] || {};
    records[record.userName][record.date] = {
      emotions: record.emotions || [],
      memo: record.memo || "",
      photoUrl: record.photoUrl || "",
      photoPath: record.photoPath || "",
      updatedAt: record.updatedAt || "",
    };
  });

  const appStateData = appStateSnapshot.exists() ? appStateSnapshot.data() : {};
  const appState = appStateData.state || appStateData;

  if (Object.keys(records).length === 0 && appState.emotionRecordsByUser) {
    return appState;
  }

  return {
    emotionUsers: appState.emotionUsers,
    currentEmotionUser: appState.currentEmotionUser,
    emotionRecordsByUser: records,
  };
}

export async function saveCloudState(state) {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  const user = await signInToFirebase();

  if (!user) {
    return;
  }

  await setDoc(getAppStateRef(user.uid), {
    emotionUsers: state.emotionUsers,
    currentEmotionUser: state.currentEmotionUser,
    updatedAt: serverTimestamp(),
  });

  await replaceRecords(user.uid, state.emotionRecordsByUser || {});
}

export async function deleteCloudRecord(userName, date) {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  const user = await signInToFirebase();

  if (!user) {
    return;
  }

  await deleteDoc(getRecordDocRef(user.uid, userName, date));
}

async function replaceRecords(uid, recordsByUser) {
  const existingRecords = await getDocs(getRecordsCollectionRef(uid));
  const nextRecordIds = new Set();
  const batch = writeBatch(db);

  Object.entries(recordsByUser).forEach(([userName, userRecords]) => {
    Object.entries(userRecords || {}).forEach(([date, record]) => {
      const recordId = getRecordId(userName, date);
      nextRecordIds.add(recordId);
      batch.set(getRecordDocRef(uid, userName, date), normalizeRecordForCloud(userName, date, record));
    });
  });

  existingRecords.forEach((recordDoc) => {
    if (!nextRecordIds.has(recordDoc.id)) {
      batch.delete(recordDoc.ref);
    }
  });

  await batch.commit();
}

function normalizeRecordForCloud(userName, date, record) {
  return {
    userName,
    date,
    emotions: record.emotions || [],
    memo: record.memo || "",
    photoUrl: record.photoUrl || (!record.photo?.startsWith("data:") ? record.photo || "" : ""),
    photoPath: record.photoPath || "",
    updatedAt: record.updatedAt || new Date().toISOString(),
  };
}

function getAppStateRef(uid) {
  return doc(db, "users", uid, "moodCalendar", "appState");
}

function getRecordsCollectionRef(uid) {
  return collection(db, "users", uid, "records");
}

function getRecordDocRef(uid, userName, date) {
  return doc(db, "users", uid, "records", getRecordId(userName, date));
}

function getRecordId(userName, date) {
  return `${encodeURIComponent(userName)}__${date}`;
}
