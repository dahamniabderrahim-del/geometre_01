const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const fallbackFingerprint = (password: string) => {
  if (typeof window === "undefined" || typeof window.btoa !== "function") {
    return `plain:${password}`;
  }

  try {
    return `plain:${window.btoa(unescape(encodeURIComponent(password)))}`;
  } catch {
    return `plain:${password}`;
  }
};

export async function getPasswordFingerprint(password: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return fallbackFingerprint(password);
  }

  const encoded = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest("SHA-256", encoded);
  return hex(digest);
}
