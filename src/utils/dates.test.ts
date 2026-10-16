import {
  daysUntilOpening,
  DECEMBER_DATES,
  formatDateIs,
  isDateUnlocked,
  isValidISODate,
  latestUnlockedDate,
  readPreviewDate,
  resolveToday,
  reykjavikDateISO,
  shiftDate,
  sitePhase,
  weekdayIs,
} from './dates';

describe('dates', () => {
  it('lists all 31 December dates', () => {
    expect(DECEMBER_DATES).toHaveLength(31);
    expect(DECEMBER_DATES[0]).toBe('2026-12-01');
    expect(DECEMBER_DATES[30]).toBe('2026-12-31');
  });

  it('uses the Reykjavik calendar date, not the device timezone', () => {
    // 23:30 UTC on 30 Nov is still 30 Nov in Reykjavik even if the device is in UTC+2.
    expect(reykjavikDateISO(new Date('2026-11-30T23:30:00Z'))).toBe('2026-11-30');
    expect(reykjavikDateISO(new Date('2026-12-01T00:00:00Z'))).toBe('2026-12-01');
  });

  it('reads a valid previewDate and ignores invalid ones', () => {
    expect(readPreviewDate('?previewDate=2026-12-24')).toBe('2026-12-24');
    expect(readPreviewDate('?previewDate=2026-02-30')).toBeNull();
    expect(readPreviewDate('?previewDate=tomorrow')).toBeNull();
    expect(resolveToday('?previewDate=2026-12-31', new Date('2026-10-16T12:00:00Z'))).toBe('2026-12-31');
    expect(resolveToday('', new Date('2026-10-16T12:00:00Z'))).toBe('2026-10-16');
  });

  it('validates ISO dates', () => {
    expect(isValidISODate('2026-12-01')).toBe(true);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('2026-12-1')).toBe(false);
  });

  it('knows the phase of the site', () => {
    expect(sitePhase('2026-11-30')).toBe('before');
    expect(sitePhase('2026-12-01')).toBe('december');
    expect(sitePhase('2026-12-31')).toBe('december');
    expect(sitePhase('2027-01-01')).toBe('after');
  });

  it('locks future dates during December and opens everything afterwards', () => {
    expect(isDateUnlocked('2026-12-11', '2026-12-12')).toBe(true);
    expect(isDateUnlocked('2026-12-12', '2026-12-12')).toBe(true);
    expect(isDateUnlocked('2026-12-13', '2026-12-12')).toBe(false);
    expect(isDateUnlocked('2026-12-31', '2027-01-04')).toBe(true);
    expect(isDateUnlocked('2026-12-01', '2026-11-30')).toBe(false);
    expect(latestUnlockedDate('2026-11-30')).toBeNull();
    expect(latestUnlockedDate('2026-12-12')).toBe('2026-12-12');
    expect(latestUnlockedDate('2027-02-01')).toBe('2026-12-31');
  });

  it('formats Icelandic dates', () => {
    expect(formatDateIs('2026-12-12')).toBe('12. desember 2026');
    expect(formatDateIs('2026-12-24', false)).toBe('24. desember');
    expect(weekdayIs('2026-12-24')).toBe('fimmtudagur');
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysUntilOpening('2026-11-30')).toBe(1);
    expect(daysUntilOpening('2026-10-16')).toBe(46);
  });
});
