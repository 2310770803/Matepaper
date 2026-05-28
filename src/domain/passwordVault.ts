import type { PasswordSecretVault } from "./types";

const ITERATIONS = 100_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function deriveKey(masterPassword: string, salt: Uint8Array, iterations: number) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    asArrayBuffer(new TextEncoder().encode(masterPassword)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: asArrayBuffer(salt),
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptPasswordSecret(
  plaintext: string,
  masterPassword: string,
): Promise<PasswordSecretVault> {
  if (!masterPassword) throw new Error("主密码不能为空");
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(masterPassword, salt, ITERATIONS);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: asArrayBuffer(iv) },
    key,
    asArrayBuffer(new TextEncoder().encode(plaintext)),
  );

  return {
    algorithm: "AES-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };
}

export async function decryptPasswordSecret(
  vault: PasswordSecretVault,
  masterPassword: string,
): Promise<string> {
  try {
    const salt = base64ToBytes(vault.salt);
    const iv = base64ToBytes(vault.iv);
    const key = await deriveKey(masterPassword, salt, vault.iterations);
    const decrypted = await crypto.subtle.decrypt(
      { name: vault.algorithm, iv: asArrayBuffer(iv) },
      key,
      asArrayBuffer(base64ToBytes(vault.ciphertext)),
    );
    return new TextDecoder().decode(decrypted);
  } catch (_error) {
    throw new Error("无法解密密码，请检查主密码");
  }
}
