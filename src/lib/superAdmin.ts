import type { SessionPayload } from './auth';

export function getSuperAdminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdmin(session: SessionPayload | null | undefined): boolean {
  if (!session) return false;
  const emails = getSuperAdminEmails();
  return emails.includes(session.email.toLowerCase());
}
