import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { db, isFirebaseConfigured, signInToFirebase } from "../firebase";
import { decryptJson, encryptJson } from "../utils/crypto";

export async function loadCloudState(familyId = "", familyKey = "") {
  if (!isFirebaseConfigured || !db) {
    return null;
  }

  const user = await signInToFirebase();

  if (!user) {
    return null;
  }

  if (familyId) {
    await ensureFamilyMember(familyId, user);
  }

  const appStateSnapshot = await getDoc(getAppStateRef(user.uid, familyId));
  const recordsSnapshot = await getDocs(getRecordsCollectionRef(user.uid, familyId));

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
      photo: record.photo || "",
      photoUrl: record.photoUrl || "",
      photoPath: record.photoPath || "",
      updatedAt: record.updatedAt || "",
    };
  });

  const appStateData = appStateSnapshot.exists() ? appStateSnapshot.data() : {};

  if (familyId && appStateData.encryptedPayload) {
    return decryptJson(appStateData.encryptedPayload, familyKey);
  }

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

export async function saveCloudState(state, familyId = "", familyKey = "") {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  const user = await signInToFirebase();

  if (!user) {
    return;
  }

  if (familyId) {
    await ensureFamilyMember(familyId, user);
    await setDoc(getAppStateRef(user.uid, familyId), {
      encrypted: true,
      encryptedPayload: await encryptJson(state, familyKey),
      recordCount: getRecordCount(state.emotionRecordsByUser || {}),
      updatedAt: serverTimestamp(),
    });
    await deleteAllRecords(user.uid, familyId);
    return;
  }

  await setDoc(getAppStateRef(user.uid, familyId), {
    emotionUsers: state.emotionUsers,
    currentEmotionUser: state.currentEmotionUser,
    updatedAt: serverTimestamp(),
  });

  await replaceRecords(user.uid, state.emotionRecordsByUser || {}, familyId);
}

export async function deleteCloudRecord(userName, date, familyId = "") {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  const user = await signInToFirebase();

  if (!user) {
    return;
  }

  await deleteDoc(getRecordDocRef(user.uid, userName, date, familyId));
}

export async function createFamilyRoom(state, familyKey) {
  if (!isFirebaseConfigured || !db) {
    return "";
  }

  const user = await signInToFirebase();

  if (!user) {
    return "";
  }

  const familyId = createInviteCode();
  await setDoc(getFamilyRef(familyId), {
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    encrypted: true,
    updatedAt: serverTimestamp(),
  });
  await saveCloudState(state, familyId, familyKey);
  return familyId;
}

export async function joinFamilyRoom(inviteCode) {
  if (!isFirebaseConfigured || !db) {
    return "";
  }

  const user = await signInToFirebase();

  if (!user) {
    return "";
  }

  const familyId = normalizeInviteCode(inviteCode);

  if (!/^FAM-[A-Z0-9]{6}$/.test(familyId)) {
    throw new Error("초대 코드는 FAM-ABC123 형식으로 입력해 주세요.");
  }

  const familySnapshot = await getDoc(getFamilyRef(familyId));

  if (!familySnapshot.exists()) {
    throw new Error("가족방을 찾지 못했어요. 초대 코드를 확인해 주세요.");
  }

  await ensureFamilyMember(familyId, user);
  return familyId;
}

async function replaceRecords(uid, recordsByUser, familyId = "") {
  const existingRecords = await getDocs(getRecordsCollectionRef(uid, familyId));
  const nextRecordIds = new Set();
  const batch = writeBatch(db);

  Object.entries(recordsByUser).forEach(([userName, userRecords]) => {
    Object.entries(userRecords || {}).forEach(([date, record]) => {
      const recordId = getRecordId(userName, date);
      nextRecordIds.add(recordId);
      batch.set(getRecordDocRef(uid, userName, date, familyId), normalizeRecordForCloud(userName, date, record));
    });
  });

  existingRecords.forEach((recordDoc) => {
    if (!nextRecordIds.has(recordDoc.id)) {
      batch.delete(recordDoc.ref);
    }
  });

  await batch.commit();
}

async function deleteAllRecords(uid, familyId = "") {
  const existingRecords = await getDocs(getRecordsCollectionRef(uid, familyId));

  if (existingRecords.empty) {
    return;
  }

  const batch = writeBatch(db);
  existingRecords.forEach((recordDoc) => {
    batch.delete(recordDoc.ref);
  });
  await batch.commit();
}

function normalizeRecordForCloud(userName, date, record) {
  return {
    userName,
    date,
    emotions: record.emotions || [],
    memo: record.memo || "",
    photo: record.photo || "",
    photoUrl: record.photoUrl || (!record.photo?.startsWith("data:") ? record.photo || "" : ""),
    photoPath: record.photoPath || "",
    updatedAt: record.updatedAt || new Date().toISOString(),
  };
}

async function ensureFamilyMember(familyId, user) {
  await setDoc(getFamilyMemberRef(familyId, user.uid), {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    joinedAt: serverTimestamp(),
  }, { merge: true });
}

function getAppStateRef(uid, familyId = "") {
  if (familyId) {
    return doc(db, "families", familyId, "moodCalendar", "appState");
  }

  return doc(db, "users", uid, "moodCalendar", "appState");
}

function getRecordsCollectionRef(uid, familyId = "") {
  if (familyId) {
    return collection(db, "families", familyId, "records");
  }

  return collection(db, "users", uid, "records");
}

function getRecordDocRef(uid, userName, date, familyId = "") {
  if (familyId) {
    return doc(db, "families", familyId, "records", getRecordId(userName, date));
  }

  return doc(db, "users", uid, "records", getRecordId(userName, date));
}

function getFamilyRef(familyId) {
  return doc(db, "families", familyId);
}

function getFamilyMemberRef(familyId, uid) {
  return doc(db, "families", familyId, "members", uid);
}

function getRecordId(userName, date) {
  return `${encodeURIComponent(userName)}__${date}`;
}

function getRecordCount(recordsByUser) {
  return Object.values(recordsByUser).reduce((count, userRecords) => count + Object.keys(userRecords || {}).length, 0);
}

function createInviteCode() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FAM-${randomPart}`;
}

function normalizeInviteCode(inviteCode) {
  return String(inviteCode || "").trim().toUpperCase();
}
