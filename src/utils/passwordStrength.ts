export function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 16) score += 10;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if ((password.match(/[0-9]/g) || []).length >= 2) score += 20;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  return Math.min(score, 100);
}

export function getStrengthInfo(score: number) {
  if (score < 40) return { label: 'Slaba', color: 'bg-red-500' };
  if (score < 60) return { label: 'Osrednja', color: 'bg-amber-500' };
  if (score < 80) return { label: 'Dobra', color: 'bg-indigo-500' };
  return { label: 'Jaka', color: 'bg-emerald-500' };
}
