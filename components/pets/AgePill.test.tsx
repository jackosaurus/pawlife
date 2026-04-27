import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AgePill } from './AgePill';
import { useAgeMoment } from '@/hooks/useAgeMoment';

jest.mock('@/hooks/useAgeMoment', () => ({
  useAgeMoment: jest.fn(),
}));

const mockUseAgeMoment = useAgeMoment as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AgePill', () => {
  it('renders default-state label', () => {
    mockUseAgeMoment.mockReturnValue({
      phase: 'default',
      label: 'Buddy is 8 years old',
      isFestive: false,
    });
    render(<AgePill petName="Buddy" dob="2018-03-14" />);
    expect(screen.getByText('Buddy is 8 years old')).toBeTruthy();
  });

  it('renders birthday-state label with cake emoji', () => {
    mockUseAgeMoment.mockReturnValue({
      phase: 'birthday',
      label: '🎂 Buddy is 9 today',
      isFestive: true,
    });
    render(<AgePill petName="Buddy" dob="2017-03-14" />);
    expect(screen.getByText('🎂 Buddy is 9 today')).toBeTruthy();
  });

  it('renders savor-state label', () => {
    mockUseAgeMoment.mockReturnValue({
      phase: 'savor',
      label: 'Buddy just turned 9',
      isFestive: false,
    });
    render(<AgePill petName="Buddy" dob="2017-03-14" />);
    expect(screen.getByText('Buddy just turned 9')).toBeTruthy();
  });

  it('renders puppy-state label', () => {
    mockUseAgeMoment.mockReturnValue({
      phase: 'puppy',
      label: 'Luna is 4 months old',
      isFestive: false,
    });
    render(<AgePill petName="Luna" dob="2026-01-01" />);
    expect(screen.getByText('Luna is 4 months old')).toBeTruthy();
  });

  it('applies festive coral tint when isFestive=true', () => {
    mockUseAgeMoment.mockReturnValue({
      phase: 'birthday',
      label: '🎂 Buddy is 9 today',
      isFestive: true,
    });
    render(<AgePill petName="Buddy" dob="2017-03-14" />);
    const pill = screen.getByTestId('age-pill');
    const style = Array.isArray(pill.props.style)
      ? Object.assign({}, ...pill.props.style)
      : pill.props.style;
    expect(style.backgroundColor).toBe('rgba(232, 115, 90, 0.15)');
    expect(style.borderColor).toBe('#E8735A');
  });

  it('does not apply festive tint when isFestive=false', () => {
    mockUseAgeMoment.mockReturnValue({
      phase: 'default',
      label: 'Buddy is 8 years old',
      isFestive: false,
    });
    render(<AgePill petName="Buddy" dob="2018-03-14" />);
    const pill = screen.getByTestId('age-pill');
    const style = Array.isArray(pill.props.style)
      ? Object.assign({}, ...pill.props.style)
      : pill.props.style;
    expect(style.backgroundColor).toBeUndefined();
    expect(style.borderColor).toBeUndefined();
  });

  it('truncates long pet name with ellipsis (numberOfLines=1)', () => {
    mockUseAgeMoment.mockReturnValue({
      phase: 'birthday',
      label: '🎂 Sir Reginald is 9 today',
      isFestive: true,
    });
    render(<AgePill petName="Sir Reginald" dob="2017-03-14" />);
    const labelNode = screen.getByTestId('age-pill-label');
    expect(labelNode.props.numberOfLines).toBe(1);
    expect(labelNode.props.ellipsizeMode).toBe('tail');
  });

  it('forwards label to accessibilityLabel for screen readers', () => {
    mockUseAgeMoment.mockReturnValue({
      phase: 'birthday',
      label: '🎂 Buddy is 9 today',
      isFestive: true,
    });
    render(<AgePill petName="Buddy" dob="2017-03-14" />);
    const pill = screen.getByTestId('age-pill');
    expect(pill.props.accessibilityLabel).toBe('🎂 Buddy is 9 today');
  });
});
