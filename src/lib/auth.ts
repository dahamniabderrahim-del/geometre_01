const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function getConfiguredAdminEmails() {
  return adminEmails;
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return adminEmails.includes(email.toLowerCase());
}
