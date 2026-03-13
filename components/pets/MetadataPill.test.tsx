import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MetadataPill } from './MetadataPill';

describe('MetadataPill', () => {
  it('renders the label', () => {
    render(<MetadataPill label="8 years" />);
    expect(screen.getByText('8 years')).toBeTruthy();
  });

  it('renders different labels', () => {
    render(<MetadataPill label="♂ Male" />);
    expect(screen.getByText('♂ Male')).toBeTruthy();
  });
});
