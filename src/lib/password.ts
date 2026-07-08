// Règles de complexité du mot de passe (partagées client + serveur)

export interface PasswordCheck {
  label: string;
  ok: boolean;
}

export function getPasswordChecks(pw: string): PasswordCheck[] {
  return [
    { label: 'Au moins 10 caractères', ok: pw.length >= 10 },
    { label: 'Une lettre minuscule', ok: /[a-z]/.test(pw) },
    { label: 'Une lettre majuscule', ok: /[A-Z]/.test(pw) },
    { label: 'Un chiffre', ok: /[0-9]/.test(pw) },
  ];
}

export function validatePasswordRules(pw: string): { valid: boolean; errors: string[] } {
  const errors = getPasswordChecks(pw).filter((c) => !c.ok).map((c) => c.label);
  return { valid: errors.length === 0, errors };
}

/**
 * Vérifie si le mot de passe apparaît dans la base Have I Been Pwned,
 * via le modèle k-anonymity : on n'envoie que les 5 premiers caractères
 * de l'empreinte SHA-1, jamais le mot de passe.
 * Fail-open : en cas de panne réseau de HIBP, on n'empêche pas l'inscription.
 */
export async function isPasswordPwned(pw: string): Promise<boolean> {
  try {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw));
    const hash = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'WalletPass-Pro' },
    });
    if (!res.ok) return false;

    const text = await res.text();
    return text.split('\n').some((line) => {
      const [suf, count] = line.trim().split(':');
      return suf === suffix && Number(count) > 0;
    });
  } catch {
    return false;
  }
}
