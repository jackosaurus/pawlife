import { useRef, useCallback } from 'react';
import { ScrollView, Pressable, Text, View, LayoutChangeEvent } from 'react-native';
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

export function TabBar({ tabs, activeTab, onTabPress }: TabBarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});
  const scrollViewWidth = useRef(0);

  const handleTabLayout = useCallback((key: string, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[key] = { x, width };
  }, []);

  const handleScrollViewLayout = useCallback((e: LayoutChangeEvent) => {
    scrollViewWidth.current = e.nativeEvent.layout.width;
  }, []);

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
    </View>
  );
}
