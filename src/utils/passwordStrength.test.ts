import { getPasswordStrength, getStrengthInfo } from './passwordStrength';

describe('getPasswordStrength', () => {
  it('returns 0 for empty password', () => {
    expect(getPasswordStrength('')).toBe(0);
  });

  it('gives 20 points for length >= 8', () => {
    // 8 chars, all lowercase → 20 (length>=8) + 15 (lowercase) = 35
    expect(getPasswordStrength('abcdefgh')).toBe(35);
  });

  it('gives extra 10 points for length >= 16', () => {
    // 16 lowercase chars → 20 (>=8) + 10 (>=16) + 15 (lowercase) = 45
    expect(getPasswordStrength('abcdefghijklmnop')).toBe(45);
  });

  it('gives 15 points for lowercase letters', () => {
    // short lowercase → 15
    expect(getPasswordStrength('abc')).toBe(15);
  });

  it('gives 15 points for uppercase letters', () => {
    // short uppercase → 15
    expect(getPasswordStrength('ABC')).toBe(15);
  });

  it('gives 20 points for 2+ digits', () => {
    // '12' → 0 (length<8) + 20 (2 digits) = 20
    expect(getPasswordStrength('12')).toBe(20);
  });

  it('does not give digit points for only 1 digit', () => {
    expect(getPasswordStrength('1')).toBe(0);
  });

  it('gives 20 points for special characters', () => {
    expect(getPasswordStrength('!')).toBe(20);
  });

  it('caps at 100', () => {
    // Strong password with everything: length>=16, lower, upper, 2+ digits, special
    // 20+10+15+15+20+20 = 100
    expect(getPasswordStrength('Abcdefghijklmnop12!')).toBe(100);
  });

  it('calculates a realistic strong password', () => {
    // 'Admin12345' → len>=8(20) + lower(15) + upper(15) + 5 digits>=2(20) = 70
    expect(getPasswordStrength('Admin12345')).toBe(70);
  });

  it('calculates a weak password', () => {
    // '123' → only has digits but less than 2? No, 3 digits >= 2 → 20
    expect(getPasswordStrength('123')).toBe(20);
  });
});

describe('getStrengthInfo', () => {
  it('returns "Slaba" for score < 40', () => {
    const info = getStrengthInfo(20);
    expect(info.label).toBe('Slaba');
    expect(info.color).toBe('bg-red-500');
  });

  it('returns "Slaba" for score 0', () => {
    expect(getStrengthInfo(0).label).toBe('Slaba');
  });

  it('returns "Slaba" for score 39', () => {
    expect(getStrengthInfo(39).label).toBe('Slaba');
  });

  it('returns "Osrednja" for score 40-59', () => {
    const info = getStrengthInfo(50);
    expect(info.label).toBe('Osrednja');
    expect(info.color).toBe('bg-amber-500');
  });

  it('returns "Osrednja" for score 40', () => {
    expect(getStrengthInfo(40).label).toBe('Osrednja');
  });

  it('returns "Dobra" for score 60-79', () => {
    const info = getStrengthInfo(70);
    expect(info.label).toBe('Dobra');
    expect(info.color).toBe('bg-indigo-500');
  });

  it('returns "Dobra" for score 60', () => {
    expect(getStrengthInfo(60).label).toBe('Dobra');
  });

  it('returns "Jaka" for score >= 80', () => {
    const info = getStrengthInfo(80);
    expect(info.label).toBe('Jaka');
    expect(info.color).toBe('bg-emerald-500');
  });

  it('returns "Jaka" for score 100', () => {
    expect(getStrengthInfo(100).label).toBe('Jaka');
  });
});
