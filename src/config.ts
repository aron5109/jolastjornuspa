/**
 * Testing switch. While true, every visitor without `?previewDate=` sees the site as it will
 * look after December: all 31 days open to browse, no teaser and no locked days.
 *
 * Set this to false before launch so the site shows the teaser until 1 December and unlocks
 * one day at a time in Reykjavik time.
 */
export const OPEN_ALL_DAYS = true;
