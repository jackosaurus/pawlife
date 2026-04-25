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
import { LinearGradient } from 'expo-linear-gradient';
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

const EDGE_FADE_WIDTH = 16;

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
        <LinearGradient
          testID="tab-bar-left-fade"
          pointerEvents="none"
          colors={[Colors.background, `${Colors.background}00`]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: EDGE_FADE_WIDTH,
          }}
        />
      ) : null}
      {showRightFade ? (
        <LinearGradient
          testID="tab-bar-right-fade"
          pointerEvents="none"
          colors={[`${Colors.background}00`, Colors.background]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: EDGE_FADE_WIDTH,
          }}
        />
      ) : null}
    </View>
  );
}
