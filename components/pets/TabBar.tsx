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

const EDGE_FADE_WIDTH = 24;
const EDGE_FADE_STRIPES = 6;

// Pure-JS edge fade (stacked stripes with stepped opacity). Avoids the native
// `expo-linear-gradient` dependency, which would require rebuilding the dev
// client to take effect — this works on JS-reload alone.
function EdgeFade({
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
  );
}

export function TabBar({ tabs, activeTab, onTabPress }: TabBarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});
  const scrollViewWidth = useRef(0);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const handleTabLayout = useCallback((key: string, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[key] = { x, width };
  }, []);

  const handleScrollViewLayout = useCallback((e: LayoutChangeEvent) => {
    scrollViewWidth.current = e.nativeEvent.layout.width;
  }, []);

  const updateFades = useCallback(
    (offsetX: number, layoutWidth: number, contentWidth: number) => {
      setShowLeftFade(offsetX > 0);
      setShowRightFade(offsetX + layoutWidth < contentWidth - 1);
    },
    [],
  );

  const handleContentSizeChange = useCallback(
    (contentWidth: number) => {
      // When content first measures, show right fade if content overflows.
      updateFades(0, scrollViewWidth.current, contentWidth);
    },
    [updateFades],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      updateFades(contentOffset.x, layoutMeasurement.width, contentSize.width);
    },
    [updateFades],
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
                className={`text-base font-semibold ${
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
      {showLeftFade ? (
        <EdgeFade side="left" testID="tab-bar-left-fade" />
      ) : null}
      {showRightFade ? (
        <EdgeFade side="right" testID="tab-bar-right-fade" />
      ) : null}
    </View>
  );
}
