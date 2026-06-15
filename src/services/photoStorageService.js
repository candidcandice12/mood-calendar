import { deleteObject, getDownloadURL, ref, uploadString } from "firebase/storage";
import { isFirebaseConfigured, signInToFirebase, storage } from "../firebase";

export async function uploadRecordPhoto(userName, date, photoDataUrl, familyId = "") {
  if (!isFirebaseConfigured || !storage || !photoDataUrl?.startsWith("data:")) {
    return null;
  }

  const user = await signInToFirebase();

  if (!user) {
    return null;
  }

  const ownerPath = familyId ? `families/${familyId}` : `users/${user.uid}`;
  const path = `${ownerPath}/records/${encodeURIComponent(userName)}/${date}/photo.jpg`;
  const photoRef = ref(storage, path);

  await uploadString(photoRef, photoDataUrl, "data_url");

  return {
    photoUrl: await getDownloadURL(photoRef),
    photoPath: path,
  };
}

export async function deleteRecordPhoto(photoPath) {
  if (!isFirebaseConfigured || !storage || !photoPath) {
    return;
  }

  try {
    await deleteObject(ref(storage, photoPath));
  } catch (error) {
    if (error.code !== "storage/object-not-found") {
      throw error;
    }
  }
}
