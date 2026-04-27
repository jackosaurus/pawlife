import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, Text, View, Platform } from 'react-native';
import { Colors } from '@/constants/colors';

type ShowToast = (message: string) => void;

interface ToastContextValue {
  show: ShowToast;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 2500;
const ANIM_MS = 200;

/**
 * Lightweight in-app toast.
 *
 * Use for low-stakes success notifications — e.g. "Luna restored",
 * "Heartgard restored". Auto-dismisses after 2.5s. NOT a substitute for
 * inline error states or destructive confirmations.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const show = useCallback<ShowToast>(
    (next: string) => {
      clearHideTimer();
      setMessage(next);
      setVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIM_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: ANIM_MS,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          setVisible(false);
        });
      }, TOAST_DURATION_MS);
    },
    [opacity],
  );

  useEffect(() => {
    return () => clearHideTimer();
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {visible && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 64 : 48,
            left: 0,
            right: 0,
            alignItems: 'center',
            opacity,
          }}
          testID="toast"
        >
          <View
            style={{
              backgroundColor: Colors.card,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: Colors.border,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
              maxWidth: '90%',
            }}
          >
            <Text
              className="text-text-primary text-base font-medium text-center"
              testID="toast-message"
            >
              {message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fail soft outside provider — emit a no-op so a missing provider can't
    // crash production code that tries to fire-and-forget a toast.
    return { show: () => undefined };
  }
  return ctx;
}
