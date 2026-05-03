import { View, Text, Image, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { MeetCard } from '@/components/ui/MeetCard';
import { PullQuote } from '@/components/ui/PullQuote';
import { Colors } from '@/constants/colors';
import { DisplayFontFamily } from '@/constants/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Trimmed from welcome's 0.40 → 0.30 to leave room for the long-form copy
// below (per design spec § "Hero treatment").
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.3);

export default function AboutScreen() {
  const router = useRouter();

  const handleSendFeedback = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics unavailable on this device — proceed without.
    }
    router.push('/(main)/feedback');
  };

  return (
    <Screen scroll>
      {/* Back arrow — matches Settings/Feedback header pattern. */}
      <View className="px-6 pt-2 pb-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          testID="about-back"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* 1. Hero — welcome-hero illustration + Fraunces "Bemy" wordmark. */}
      <View>
        <Image
          testID="about-hero"
          accessibilityLabel="Bemy hero illustration: a cat and a dog cuddled together."
          source={require('../../assets/images/welcome-hero.png')}
          style={{ height: HERO_HEIGHT, width: '100%' }}
          resizeMode="cover"
        />
        <View className="items-center mt-4 px-6">
          <Text
            accessibilityRole="header"
            accessibilityLabel="About Bemy"
            style={{
              fontFamily: DisplayFontFamily.bold,
              fontSize: 44,
              lineHeight: 48,
              color: Colors.primary,
            }}
            testID="about-wordmark"
          >
            Bemy
          </Text>
          <Text className="text-body text-text-secondary text-center mt-3">
            A digital home for your pet family.
          </Text>
        </View>
      </View>

      <View className="px-6 mt-8 pb-10">
        {/* 2. Hi, I'm Jack */}
        <Text
          accessibilityRole="header"
          className="text-title text-primary"
          style={{
            fontFamily: DisplayFontFamily.semibold,
            color: Colors.primary,
          }}
        >
          Hi, I&apos;m Jack
        </Text>
        <Text className="text-body text-text-primary mt-3">
          I&apos;m an indie developer in Australia, and I built Bemy on nights
          and weekends because I wanted something better for my own two dogs.
        </Text>
        <Text className="text-body text-text-primary mt-3">
          Their names are Beau and Remy.{' '}
          <Text style={{ fontWeight: '600' }}>Be</Text>au +{' '}
          <Text style={{ fontWeight: '600' }}>Re</Text>my — that&apos;s where
          the name came from.
        </Text>

        {/* 3. Meet Beau — founder-supplied photo (commit 1f14cf9, pulled in
            during rebase). Falls back to the bordered initials avatar
            automatically if the asset is ever removed. */}
        <View className="mt-8">
          <MeetCard
            name="Beau"
            subtitle="Cocker spaniel × poodle · 8 years"
            petType="dog"
            photoUri={require('../../assets/images/beau.jpg')}
            body={
              <>
                <Text className="text-body text-text-primary">
                  Beau is the older of the two, and probably one of the
                  sweetest dogs you&apos;ll ever meet.
                </Text>
                <View className="h-3" />
                <Text className="text-body text-text-primary">
                  He&apos;s also — and yes, this sounds invented — allergic to
                  grass. And lamb. He gets ear infections every couple of
                  months that need ear drops on a regular cycle, and he goes
                  in for allergy shots every few months too. Tracking what
                  dose he&apos;s on, when the next ear-drop round is due, what
                  dates he last had a shot — that&apos;s a recurring task in
                  our house, and a lot of why Bemy exists.
                </Text>
              </>
            }
          />
        </View>

        {/* 4. Meet Remy — founder-supplied photo. */}
        <View className="mt-8">
          <MeetCard
            name="Remy"
            subtitle="Bordoodle × poodle · 6 years"
            petType="dog"
            photoUri={require('../../assets/images/remy.jpg')}
            body={
              <>
                <Text className="text-body text-text-primary">
                  Remy is the younger one, and an absolute demon of energy.
                </Text>
                <View className="h-3" />
                <Text className="text-body text-text-primary">
                  There&apos;s enough border collie in the bordoodle that he
                  is{' '}
                  <Text style={{ fontStyle: 'italic' }}>in love</Text> with a
                  ball — any ball, all balls, forever. People at the dog park
                  love throwing for him because he&apos;ll never stop chasing
                  it, which is also the problem: he doesn&apos;t know when to
                  stop, so he sometimes hurts himself if we let it go too
                  long. He&apos;s also completely inseparable from Beau. Where
                  one goes, the other is about three seconds behind.
                </Text>
              </>
            }
          />
        </View>

        {/* 5. Pull-quote — namesake reveal. */}
        <PullQuote accessibilityLabel="Bemy equals Beau plus Remy">
          Bemy = Beau + Remy
        </PullQuote>

        {/* 6. Why I built it */}
        <Text
          accessibilityRole="header"
          className="text-title text-primary"
          style={{
            fontFamily: DisplayFontFamily.semibold,
            color: Colors.primary,
          }}
        >
          Why I built it
        </Text>
        <Text className="text-body text-text-primary mt-3">
          Between Beau&apos;s medications and Remy&apos;s vet visits, I kept
          losing track of small things — when the next allergy shot was due,
          what dose Beau was last on, whether Remy&apos;s last weight check
          was three months ago or six.
        </Text>
        <Text className="text-body text-text-primary mt-3">
          I wanted one place that held all of it, looked nice enough that
          I&apos;d actually open it, and didn&apos;t try to sell me anything.
          So I started building one for myself.
        </Text>
        <Text className="text-body text-text-primary mt-3">
          A handful of friends with their own dogs and cats started using
          early versions, and a lot of what&apos;s in the app now exists
          because they asked for it. The vaccination reminders, the food
          change history, the gentler language around archiving a pet — those
          came from real people telling me what they actually needed.
        </Text>

        {/* 7. What Bemy is, and isn't */}
        <Text
          accessibilityRole="header"
          className="text-title text-primary mt-8"
          style={{
            fontFamily: DisplayFontFamily.semibold,
            color: Colors.primary,
          }}
        >
          What Bemy is, and isn&apos;t
        </Text>
        <Text className="text-body text-text-primary mt-3">
          Bemy is a small, careful app for keeping your pet family&apos;s
          records in one place. It is not a venture-backed startup, a vet on
          demand, or a substitute for actual medical advice. If something
          feels wrong with your pet, please call your vet, not your phone.
        </Text>
        <Text className="text-body text-text-primary mt-3">
          What I can promise is that the app is built with care, the data is
          yours, and there&apos;s a real person on the other end of every bug
          report.
        </Text>

        {/* 8. A small ask */}
        <Text
          accessibilityRole="header"
          className="text-title text-primary mt-8"
          style={{
            fontFamily: DisplayFontFamily.semibold,
            color: Colors.primary,
          }}
        >
          A small ask
        </Text>
        <Text className="text-body text-text-primary mt-3">
          If you&apos;ve used Bemy for more than a day or two, you probably
          already know one thing that would make it better. I&apos;d love to
          hear it.
        </Text>
        <Text className="text-body text-text-primary mt-3">
          Tap{' '}
          <Text style={{ fontWeight: '600' }}>Send Feedback</Text> in the menu
          and tell me the smallest concrete thing you&apos;d change — a
          confusing label, a missing field, a screen that feels slow. Every
          message gets read by me.
        </Text>

        {/* CTA */}
        <View className="mt-10" testID="about-cta-container">
          <Button title="Send Feedback" onPress={handleSendFeedback} />
        </View>

        {/* 9. Sign-off */}
        <Text
          accessibilityRole="header"
          className="text-title text-primary mt-10"
          style={{
            fontFamily: DisplayFontFamily.semibold,
            color: Colors.primary,
          }}
        >
          Thanks for being here
        </Text>
        <Text className="text-body text-text-primary mt-3">
          From one pet person to another — go give your own pet a scratch
          behind the ears from me.
        </Text>
        <Text className="text-body text-text-primary mt-3">— Jack</Text>

        {/* Footer */}
        <Text
          className="text-caption text-text-secondary text-center mt-10"
          testID="about-footer"
        >
          Made with care in Australia · 2026
        </Text>
      </View>
    </Screen>
  );
}
