type MaybeError =
  | {
      message?: string | null;
      code?: string | null;
    }
  | null
  | undefined;

const includesAny = (text: string, patterns: string[]) => {
  return patterns.some((pattern) => text.includes(pattern));
};

export const getReadableErrorMessage = (
  error: MaybeError,
  fallback = "Une erreur est survenue."
) => {
  const message = (error?.message ?? "").toLowerCase().trim();
  const code = (error?.code ?? "").toLowerCase().trim();

  if (!message && !code) {
    return fallback;
  }

  if (code === "23505" || includesAny(message, ["duplicate key", "already exists"])) {
    return "Cette valeur existe deja.";
  }

  if (includesAny(message, ["row-level security", "rls", "permission denied"])) {
    return "Action refusee par la securite des donnees.";
  }

  if (includesAny(message, ["failed to fetch", "networkerror", "network error"])) {
    return "Connexion reseau impossible. Reessayez.";
  }

  if (includesAny(message, ["jwt", "token", "session"])) {
    return "Session invalide. Reconnectez-vous puis reessayez.";
  }

  if (includesAny(message, ["invalid login credentials", "invalid credentials"])) {
    return "Identifiants invalides.";
  }

  return error?.message ?? fallback;
};
