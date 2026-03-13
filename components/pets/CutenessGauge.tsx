import { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { Colors } from '@/constants/colors';

const HEARTS = ['❤️', '💕', '💖', '❤️', '💕', '💖'];

export function CutenessGauge() {
  const [activated, setActivated] = useState(false);
  const fillAnim = useRef(new Animated.Value(0.1)).current; // 1/10
  const labelScale = useRef(new Animated.Value(1)).current;
  const heartAnims = useRef(
    HEARTS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      scale: new Animated.Value(0),
    })),
  ).current;

  const handlePress = useCallback(() => {
    if (activated) return;
    setActivated(true);

    // Fill bar to 10/10
    Animated.spring(fillAnim, {
      toValue: 1,
      tension: 40,
      friction: 6,
      useNativeDriver: false,
    }).start();

    // Bounce the label
    Animated.sequence([
      Animated.timing(labelScale, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(labelScale, {
        toValue: 1,
        tension: 80,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Hearts burst with staggered delay
    heartAnims.forEach((anim, i) => {
      const delay = i * 80;
      const randomY = -(40 + Math.random() * 50);
      const randomX = -10 + Math.random() * 30;

      Animated.sequence([
        Animated.delay(delay + 300), // wait for bar to mostly fill
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 0.8 + Math.random() * 0.6,
            tension: 60,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: randomY,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateX, {
            toValue: randomX,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activated, fillAnim, labelScale, heartAnims]);

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="mb-4">
      <Text className="text-text-secondary text-sm mb-1.5 ml-1">
        Cuteness Level
      </Text>
      <Pressable
        onPress={handlePress}
        className="bg-white px-4 py-3.5"
        style={{ borderColor: Colors.border, borderWidth: 1, borderRadius: 12 }}
        testID="cuteness-gauge"
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base text-text-primary">
            {activated ? 'Off the charts!' : 'Tap to measure...'}
          </Text>
          <Animated.Text
            className="text-base font-bold"
            style={[
              { color: activated ? Colors.accent : Colors.textSecondary },
              { transform: [{ scale: labelScale }] },
            ]}
          >
            {activated ? '10/10' : '1/10'}
          </Animated.Text>
        </View>

        <View className="relative">
          {/* Track */}
          <View
            className="h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: `${Colors.border}` }}
          >
            {/* Fill */}
            <Animated.View
              className="h-full rounded-full"
              style={{
                width: fillWidth,
                backgroundColor: Colors.accent,
              }}
            />
          </View>

          {/* Hearts container — positioned at the right end of the bar */}
          <View
            className="absolute"
            style={{ right: -4, top: -8 }}
            pointerEvents="none"
          >
            {HEARTS.map((heart, i) => (
              <Animated.Text
                key={i}
                style={{
                  position: 'absolute',
                  fontSize: 16,
                  opacity: heartAnims[i].opacity,
                  transform: [
                    { translateY: heartAnims[i].translateY },
                    { translateX: heartAnims[i].translateX },
                    { scale: heartAnims[i].scale },
                  ],
                }}
              >
                {heart}
              </Animated.Text>
            ))}
          </View>
        </View>
      </Pressable>
    </View>
  );
}
