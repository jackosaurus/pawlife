import { useRef, useCallback, useState } from 'react';
import {
  ScrollView,
  Pressable,
  Text,
  View,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export interface Tab {
  key: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

const EDGE_FADE_WIDTH = 28;
const EDGE_FADE_STRIPES = 6;
const CHEVRON_SIZE = 14;
const CHEVRON_INSET = 6;

// Pure-JS overflow indicator: stacked white stripes (stepped opacity) for a
// soft fade, plus a small chevron icon centered vertically that signals the
// scroll direction. The fade alone is invisible against a white tab bar when
// the offscreen tab is fully out of view, so the chevron is the primary
// signal and the fade is secondary reinforcement. Avoids
// `expo-linear-gradient` so it works on JS-reload alone.
function OverflowIndicator({
  side,
  testID,
}: {
  side: 'left' | 'right';
  testID?: string;
}) {
  const stripeWidth = EDGE_FADE_WIDTH / EDGE_FADE_STRIPES;
  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side]: 0,
        width: EDGE_FADE_WIDTH,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
        }}
      >
        {Array.from({ length: EDGE_FADE_STRIPES }).map((_, i) => {
          const opacity =
            side === 'left'
              ? 1 - i / (EDGE_FADE_STRIPES - 1)
              : i / (EDGE_FADE_STRIPES - 1);
          return (
            <View
              key={i}
              style={{
                width: stripeWidth,
                backgroundColor: '#FFFFFF',
                opacity,
              }}
            />
          );
        })}
      </View>
      <View
        testID={testID ? `${testID}-chevron` : undefined}
        style={{
          position: 'absolute',
          [side]: CHEVRON_INSET,
          top: 0,
          bottom: 0,
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name={side === 'left' ? 'chevron-back' : 'chevron-forward'}
          size={CHEVRON_SIZE}
          color={Colors.textSecondary}
          style={{ opacity: 0.6 }}
        />
      </View>
    </View>
  );
}

export function TabBar({ tabs, activeTab, onTabPress }: TabBarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});
  const scrollViewWidth = useRef(0);
  const [showLeftOverflow, setShowLeftOverflow] = useState(false);
  const [showRightOverflow, setShowRightOverflow] = useState(false);

  const handleTabLayout = useCallback((key: string, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[key] = { x, width };
  }, []);

  const handleScrollViewLayout = useCallback((e: LayoutChangeEvent) => {
    scrollViewWidth.current = e.nativeEvent.layout.width;
  }, []);

  const updateOverflow = useCallback(
    (offsetX: number, layoutWidth: number, contentWidth: number) => {
      setShowLeftOverflow(offsetX > 0);
      setShowRightOverflow(offsetX + layoutWidth < contentWidth - 1);
    },
    [],
  );

  const handleContentSizeChange = useCallback(
    (contentWidth: number) => {
      // When content first measures, show right indicator if content overflows.
      updateOverflow(0, scrollViewWidth.current, contentWidth);
    },
    [updateOverflow],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      updateOverflow(contentOffset.x, layoutMeasurement.width, contentSize.width);
    },
    [updateOverflow],
  );

  const handleTabPress = useCallback((key: string) => {
    onTabPress(key);
    const layout = tabLayouts.current[key];
    if (layout && scrollRef.current) {
      // Center the tab in the scroll view
      const scrollTo = layout.x - (scrollViewWidth.current / 2) + (layout.width / 2);
      scrollRef.current.scrollTo({ x: Math.max(0, scrollTo), animated: true });
    }
  }, [onTabPress]);

  return (
    <View className="bg-white border-b border-border">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onLayout={handleScrollViewLayout}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={handleContentSizeChange}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress(tab.key)}
              onLayout={(e) => handleTabLayout(tab.key, e)}
              className="mr-2 py-3 px-4"
              testID={`tab-${tab.key}`}
            >
              <Text
                className={`text-callout font-semibold ${
                  isActive ? 'text-primary' : 'text-text-secondary'
                }`}
              >
                {tab.label}
              </Text>
              {isActive ? (
                <View
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ backgroundColor: Colors.primary }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      {showLeftOverflow ? (
        <OverflowIndicator side="left" testID="tab-bar-left-fade" />
      ) : null}
      {showRightOverflow ? (
        <OverflowIndicator side="right" testID="tab-bar-right-fade" />
      ) : null}
    </View>
  );
}
