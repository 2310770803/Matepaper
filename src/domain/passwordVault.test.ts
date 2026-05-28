import { describe, expect, it } from "vitest";
import { decryptPasswordSecret, encryptPasswordSecret } from "./passwordVault";

describe("password vault", () => {
  it("encrypts a password secret without storing plaintext", async () => {
    const vault = await encryptPasswordSecret("correct horse battery staple", "master-pass");

    expect(vault.ciphertext).not.toContain("correct");
    expect(vault.ciphertext).not.toBe("correct horse battery staple");
    expect(vault.algorithm).toBe("AES-GCM");

    await expect(decryptPasswordSecret(vault, "master-pass")).resolves.toBe(
      "correct horse battery staple",
    );
  });

  it("rejects decrypting with a wrong master password", async () => {
    const vault = await encryptPasswordSecret("sensitive", "right-pass");

    await expect(decryptPasswordSecret(vault, "wrong-pass")).rejects.toThrow(
      "无法解密密码",
    );
  });
});
