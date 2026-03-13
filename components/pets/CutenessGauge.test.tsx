import { render, fireEvent, screen } from '@testing-library/react-native';
import { CutenessGauge } from './CutenessGauge';

describe('CutenessGauge', () => {
  it('renders label and initial state', () => {
    render(<CutenessGauge />);
    expect(screen.getByText('Cuteness Level')).toBeTruthy();
    expect(screen.getByText('Tap to measure...')).toBeTruthy();
    expect(screen.getByText('1/10')).toBeTruthy();
  });

  it('activates on press and shows 10/10', () => {
    render(<CutenessGauge />);
    fireEvent.press(screen.getByTestId('cuteness-gauge'));
    expect(screen.getByText('Off the charts!')).toBeTruthy();
    expect(screen.getByText('10/10')).toBeTruthy();
  });

  it('does not change on second press', () => {
    render(<CutenessGauge />);
    fireEvent.press(screen.getByTestId('cuteness-gauge'));
    expect(screen.getByText('10/10')).toBeTruthy();
    // Second press should keep 10/10
    fireEvent.press(screen.getByTestId('cuteness-gauge'));
    expect(screen.getByText('10/10')).toBeTruthy();
  });
});
