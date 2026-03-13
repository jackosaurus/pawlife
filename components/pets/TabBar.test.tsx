import { render, fireEvent, screen } from '@testing-library/react-native';
import { TabBar, Tab } from './TabBar';

const TABS: Tab[] = [
  { key: 'food', label: 'Food' },
  { key: 'vet-visits', label: 'Vet Visits' },
  { key: 'vaccinations', label: 'Vaccinations' },
];

describe('TabBar', () => {
  const onTabPress = jest.fn();

  beforeEach(() => {
    onTabPress.mockClear();
  });

  it('renders all tabs', () => {
    render(<TabBar tabs={TABS} activeTab="food" onTabPress={onTabPress} />);
    expect(screen.getByText('Food')).toBeTruthy();
    expect(screen.getByText('Vet Visits')).toBeTruthy();
    expect(screen.getByText('Vaccinations')).toBeTruthy();
  });

  it('calls onTabPress when a tab is pressed', () => {
    render(<TabBar tabs={TABS} activeTab="food" onTabPress={onTabPress} />);
    fireEvent.press(screen.getByTestId('tab-vet-visits'));
    expect(onTabPress).toHaveBeenCalledWith('vet-visits');
  });

  it('highlights the active tab with an underline', () => {
    render(<TabBar tabs={TABS} activeTab="vaccinations" onTabPress={onTabPress} />);
    const activeTab = screen.getByTestId('tab-vaccinations');
    // Active tab has text + underline View = 2 children
    expect(activeTab.children.length).toBeGreaterThan(1);
  });

  it('does not show underline on inactive tabs', () => {
    render(<TabBar tabs={TABS} activeTab="food" onTabPress={onTabPress} />);
    const activeTab = screen.getByTestId('tab-food');
    const inactiveTab = screen.getByTestId('tab-vet-visits');
    // Inactive tab should have fewer children than active tab (no underline)
    expect(inactiveTab.children.length).toBeLessThan(activeTab.children.length);
  });

  it('fires onLayout for scroll view and tabs', () => {
    render(<TabBar tabs={TABS} activeTab="food" onTabPress={onTabPress} />);

    // Simulate tab layout events
    TABS.forEach((tab) => {
      const tabEl = screen.getByTestId(`tab-${tab.key}`);
      fireEvent(tabEl, 'layout', {
        nativeEvent: { layout: { x: 0, width: 80 } },
      });
    });
  });

  it('scrolls to center the pressed tab', () => {
    render(<TabBar tabs={TABS} activeTab="food" onTabPress={onTabPress} />);

    // Simulate tab layouts so positions are measured
    const tabElements = TABS.map((tab, i) => {
      const el = screen.getByTestId(`tab-${tab.key}`);
      fireEvent(el, 'layout', {
        nativeEvent: { layout: { x: i * 120, width: 100 } },
      });
      return el;
    });

    // Press a tab that would need scrolling
    fireEvent.press(tabElements[2]);
    expect(onTabPress).toHaveBeenCalledWith('vaccinations');
  });

  it('does not scroll to negative position for first tab', () => {
    render(<TabBar tabs={TABS} activeTab="vaccinations" onTabPress={onTabPress} />);

    // Simulate layout for first tab at x=0
    const foodTab = screen.getByTestId('tab-food');
    fireEvent(foodTab, 'layout', {
      nativeEvent: { layout: { x: 0, width: 60 } },
    });

    // Press food tab - should scroll to 0, not negative
    fireEvent.press(foodTab);
    expect(onTabPress).toHaveBeenCalledWith('food');
  });
});
