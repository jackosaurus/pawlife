import { Colors } from './colors';

describe('Colors', () => {
  it('has the correct background color', () => {
    expect(Colors.background).toBe('#FFF8E7');
  });

  it('has the correct primary color', () => {
    expect(Colors.primary).toBe('#4A2157');
  });

  it('has all required color tokens', () => {
    expect(Colors).toHaveProperty('background');
    expect(Colors).toHaveProperty('primary');
    expect(Colors).toHaveProperty('primaryPressed');
    expect(Colors).toHaveProperty('accent');
    expect(Colors).toHaveProperty('destructive');
    expect(Colors).toHaveProperty('card');
    expect(Colors).toHaveProperty('textPrimary');
    expect(Colors).toHaveProperty('textSecondary');
    expect(Colors).toHaveProperty('statusGreen');
    expect(Colors).toHaveProperty('statusAmber');
    expect(Colors).toHaveProperty('statusOverdue');
    expect(Colors).toHaveProperty('border');
  });

  it('keeps destructive distinct from accent and statusOverdue', () => {
    // Brand coral and destructive red must never share a hex.
    expect(Colors.destructive).not.toBe(Colors.accent);
    expect(Colors.destructive).not.toBe(Colors.statusOverdue);
    expect(Colors.destructive).toBe('#E5484D');
  });
});
