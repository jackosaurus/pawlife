import { Typography } from './typography';

describe('Typography tokens', () => {
  it('exposes the expected semantic tokens', () => {
    expect(Object.keys(Typography).sort()).toEqual(
      [
        'body',
        'buttonSm',
        'callout',
        'caption',
        'display',
        'footnote',
        'headline',
        'title',
      ].sort(),
    );
  });

  it('matches the values shipped in tailwind.config.js', () => {
    expect(Typography.display).toEqual({ fontSize: 30, lineHeight: 36 });
    expect(Typography.title).toEqual({ fontSize: 22, lineHeight: 28 });
    expect(Typography.headline).toEqual({
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600',
    });
    expect(Typography.body).toEqual({ fontSize: 17, lineHeight: 24 });
    expect(Typography.callout).toEqual({ fontSize: 16, lineHeight: 22 });
    expect(Typography.footnote).toEqual({ fontSize: 13, lineHeight: 18 });
    expect(Typography.caption).toEqual({ fontSize: 12, lineHeight: 16 });
    expect(Typography.buttonSm).toEqual({
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
    });
  });

  it('all tokens have positive sizes and lineHeight >= fontSize', () => {
    for (const [name, token] of Object.entries(Typography)) {
      expect(token.fontSize).toBeGreaterThan(0);
      expect(token.lineHeight).toBeGreaterThanOrEqual(token.fontSize);
      // sanity: every token defines both fontSize and lineHeight
      // (TS already enforces this; runtime asserts for completeness)
      expect(typeof token.fontSize).toBe('number');
      expect(typeof token.lineHeight).toBe('number');
      // Avoid an unused-variable warning while keeping the loop readable.
      void name;
    }
  });
});
