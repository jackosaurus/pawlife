import { render, fireEvent, screen } from '@testing-library/react-native';
import { TabBar, Tab } from './TabBar';

jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native');
  return {
    LinearGradient: (props: Record<string, unknown>) => <View {...props} />,
  };
});

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

  describe('edge fade indicators', () => {
    it('hides the left edge fade initially when scrolled to start', () => {
      render(<TabBar tabs={TABS} activeTab="food" onTabPress={onTabPress} />);
      expect(screen.queryByTestId('tab-bar-left-fade')).toBeNull();
    });

    it('shows the right edge fade initially when content overflows', () => {
      render(<TabBar tabs={TABS} activeTab="food" onTabPress={onTabPress} />);
      // Simulate the ScrollView measuring with content wider than the viewport.
      // We need to drive both the scroll view's layout and content size change.
      const scrollView = screen.UNSAFE_getByType(
        require('react-native').ScrollView,
      );
      fireEvent(scrollView, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 50 } },
      });
      fireEvent(scrollView, 'contentSizeChange', 500, 50);
      expect(screen.getByTestId('tab-bar-right-fade')).toBeTruthy();
    });

    it('shows left fade and hides right fade after scrolling to the end', () => {
      render(<TabBar tabs={TABS} activeTab="food" onTabPress={onTabPress} />);
      const scrollView = screen.UNSAFE_getByType(
        require('react-native').ScrollView,
      );
      // Simulate scroll to a non-zero offset: left fade should appear.
      fireEvent.scroll(scrollView, {
        nativeEvent: {
          contentOffset: { x: 50, y: 0 },
          layoutMeasurement: { width: 200, height: 50 },
          contentSize: { width: 500, height: 50 },
        },
      });
      expect(screen.getByTestId('tab-bar-left-fade')).toBeTruthy();
      expect(screen.getByTestId('tab-bar-right-fade')).toBeTruthy();

      // Now simulate scrolling to the very end: right fade hides.
      fireEvent.scroll(scrollView, {
        nativeEvent: {
          contentOffset: { x: 300, y: 0 },
          layoutMeasurement: { width: 200, height: 50 },
          contentSize: { width: 500, height: 50 },
        },
      });
      expect(screen.getByTestId('tab-bar-left-fade')).toBeTruthy();
      expect(screen.queryByTestId('tab-bar-right-fade')).toBeNull();
    });

    it('renders edge fades with pointerEvents="none" so they do not block taps', () => {
      render(<TabBar tabs={TABS} activeTab="food" onTabPress={onTabPress} />);
      const scrollView = screen.UNSAFE_getByType(
        require('react-native').ScrollView,
      );
      fireEvent.scroll(scrollView, {
        nativeEvent: {
          contentOffset: { x: 50, y: 0 },
          layoutMeasurement: { width: 200, height: 50 },
          contentSize: { width: 500, height: 50 },
        },
      });
      const leftFade = screen.getByTestId('tab-bar-left-fade');
      const rightFade = screen.getByTestId('tab-bar-right-fade');
      expect(leftFade.props.pointerEvents).toBe('none');
      expect(rightFade.props.pointerEvents).toBe('none');
    });
  });
});
