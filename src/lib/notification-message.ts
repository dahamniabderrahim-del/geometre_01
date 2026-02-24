type ContactNotificationMessageInput = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

export type ParsedContactNotificationMessage = {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  subject: string;
  body: string;
};

const clean = (value: string) => value.trim();

const extractLabeledValue = (lines: string[], labels: string[]) => {
  for (const line of lines) {
    for (const label of labels) {
      const regex = new RegExp(`^${label}\\s*:\\s*(.*)$`, "i");
      const match = line.match(regex);
      if (match?.[1]) {
        return clean(match[1]);
      }
    }
  }

  return "";
};

export const formatContactNotificationMessage = (input: ContactNotificationMessageInput) => {
  return [
    `Nom: ${clean(input.name)}`,
    `Email: ${clean(input.email)}`,
    `Telephone: ${clean(input.phone)}`,
    `Sujet: ${clean(input.subject)}`,
    "Message:",
    clean(input.message),
  ].join("\n");
};

export const parseContactNotificationMessage = (raw: string): ParsedContactNotificationMessage => {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const firstLine = lines[0] ?? "";

  const senderMatch = firstLine.match(/^(.*)\((.*)\)$/);
  const legacySenderName = senderMatch?.[1]?.trim() || firstLine || "Utilisateur";
  const legacySenderEmail = senderMatch?.[2]?.trim() || "";

  const senderName = extractLabeledValue(lines, ["nom"]) || legacySenderName;
  const senderEmail = extractLabeledValue(lines, ["email"]) || legacySenderEmail;
  const senderPhone = extractLabeledValue(lines, ["telephone"]);
  const subject = extractLabeledValue(lines, ["sujet"]);

  const messageLineIndex = lines.findIndex((line) => /^message\s*:/i.test(line));
  const subjectLineIndex = lines.findIndex((line) => /^sujet\s*:/i.test(line));

  const body =
    messageLineIndex >= 0
      ? lines.slice(messageLineIndex + 1).join("\n")
      : subjectLineIndex >= 0
        ? lines.slice(subjectLineIndex + 1).join("\n")
        : lines.slice(1).join("\n");

  return {
    senderName,
    senderEmail,
    senderPhone,
    subject,
    body,
  };
};
