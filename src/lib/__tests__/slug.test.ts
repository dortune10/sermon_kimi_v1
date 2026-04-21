import { generateSlug, normalizeSlug } from '../slug';

describe('generateSlug', () => {
  it('lowercases and hyphenates words', () => {
    expect(generateSlug('Grace Community Church')).toBe('grace-community-church');
  });

  it('strips special characters', () => {
    expect(generateSlug("St. Mary's Cathedral")).toBe('st-marys-cathedral');
  });

  it('collapses multiple spaces/hyphens', () => {
    expect(generateSlug('First  Baptist  Church')).toBe('first-baptist-church');
  });

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug('  Church Name  ')).toBe('church-name');
  });
});

describe('normalizeSlug', () => {
  it('returns slug unchanged if already normalized', () => {
    expect(normalizeSlug('grace-community-church')).toBe('grace-community-church');
  });

  it('lowercases uppercase slugs', () => {
    expect(normalizeSlug('Grace-Community')).toBe('grace-community');
  });
});
