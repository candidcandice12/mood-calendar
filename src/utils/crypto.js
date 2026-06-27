const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function createFamilySecret() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function encryptJson(value, secret) {
  const key = await getAesKey(secret);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const encodedValue = textEncoder.encode(JSON.stringify(value));
  const encryptedValue = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encodedValue);

  return `${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(encryptedValue))}`;
}

export async function decryptJson(payload, secret) {
  const [ivText, encryptedText] = String(payload || "").split(".");

  if (!ivText || !encryptedText) {
    throw new Error("암호화된 기록 형식이 올바르지 않아요.");
  }

  const key = await getAesKey(secret);
  const decryptedValue = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlToBytes(ivText) },
    key,
    base64UrlToBytes(encryptedText),
  );

  return JSON.parse(textDecoder.decode(decryptedValue));
}

async function getAesKey(secret) {
  if (!secret) {
    throw new Error("가족방 암호키가 필요해요.");
  }

  const keyMaterial = await crypto.subtle.digest("SHA-256", textEncoder.encode(secret));
  return crypto.subtle.importKey("raw", keyMaterial, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
