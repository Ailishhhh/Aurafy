import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Screen, Txt, GlassCard } from '@/components';
import { chatStore, useChat } from '@/features/coach/chatStore';
import { UnlockGate } from '@/features/invite/UnlockGate';
import { useAnalysis } from '@/store/analysisStore';
import { useInvite } from '@/features/invite/inviteStore';
import { REQUIRED_INVITES } from '@/config';
import { palette, gradients, spacing, radius, fonts, hitSlop } from '@/theme';

const TOPICS: Record<string, { title: string; label: string; starters: string[] }> = {
  general: {
    title: 'Your Coach',
    label: 'general looksmaxxing & self-improvement',
    starters: ['What should I focus on first?', 'Quick wins for my face?', 'How do I look more attractive?'],
  },
  physique: {
    title: 'Physique Coach',
    label: 'building physique, workouts & nutrition',
    starters: ['Can I swap an exercise?', 'Best protein for my diet?', 'How do I get a V-taper?'],
  },
  height: {
    title: 'Height & Posture',
    label: 'height, posture & looking taller',
    starters: ['How do I fix my posture?', 'Can I still grow taller?', 'Exercises to look taller?'],
  },
  skincare: {
    title: 'Skin Coach',
    label: 'skincare, acne, pigmentation & routine',
    starters: ['My skin reacts to retinol, help?', 'Routine for oily skin?', 'How to fade dark spots?'],
  },
};

export default function Chat() {
  const router = useRouter();
  const { topic: rawTopic } = useLocalSearchParams<{ topic: string }>();
  const topic = String(rawTopic || 'general');
  const meta = TOPICS[topic] ?? TOPICS.general;

  const { conversations, sending } = useChat();
  const messages = conversations[topic] ?? [];
  const { isPremium } = useAnalysis();
  const { invitesSent } = useInvite();
  const unlocked = isPremium || invitesSent >= REQUIRED_INVITES;

  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(t);
  }, [messages.length, sending]);

  const send = (msg?: string) => {
    const content = (msg ?? text).trim();
    if (!content || sending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText('');
    chatStore.send(topic, meta.label, content);
  };

  return (
    <Screen bleed edges={['top']} subduedBackground>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={hitSlop} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={palette.textPrimary} />
        </Pressable>
        <View style={styles.headerTitle}>
          <LinearGradient colors={gradients.aura} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
            <Ionicons name="sparkles" size={15} color={palette.white} />
          </LinearGradient>
          <Txt variant="heading">{meta.title}</Txt>
        </View>
        <View style={styles.iconBtn} />
      </View>

      {!unlocked ? (
        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
          <UnlockGate onPremium={() => router.push('/paywall')} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={8}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.messages}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 && (
              <View style={styles.empty}>
                <Txt variant="body" color={palette.textSecondary} center>
                  Ask me anything about {meta.label}. I know your profile, so it&apos;s personal.
                </Txt>
                <View style={styles.starters}>
                  {meta.starters.map((s) => (
                    <Pressable key={s} onPress={() => send(s)} style={styles.starterChip}>
                      <Txt variant="caption" color={palette.textPrimary}>
                        {s}
                      </Txt>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {messages.map((m, i) => (
              <Animated.View
                key={i}
                entering={(m.role === 'user' ? FadeInUp : FadeInDown).duration(280)}
                style={[styles.bubbleRow, m.role === 'user' ? styles.rowRight : styles.rowLeft]}
              >
                {m.role === 'user' ? (
                  <LinearGradient colors={gradients.aura} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.bubble, styles.userBubble]}>
                    <Txt variant="body" color={palette.white}>
                      {m.content}
                    </Txt>
                  </LinearGradient>
                ) : (
                  <View style={[styles.bubble, styles.aiBubble]}>
                    <Txt variant="body" color={palette.textPrimary}>
                      {m.content}
                    </Txt>
                  </View>
                )}
              </Animated.View>
            ))}

            {sending && (
              <View style={[styles.bubbleRow, styles.rowLeft]}>
                <View style={[styles.bubble, styles.aiBubble]}>
                  <Txt variant="body" color={palette.textTertiary}>
                    Coach is typing…
                  </Txt>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input bar */}
          <View style={styles.inputWrap}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="Ask your coach…"
                placeholderTextColor={palette.textTertiary}
                selectionColor={palette.violetBright}
                multiline
                onSubmitEditing={() => send()}
              />
              <Pressable onPress={() => send()} disabled={!text.trim() || sending} style={styles.sendBtn}>
                <LinearGradient
                  colors={text.trim() && !sending ? gradients.aura : ['#2A2640', '#2A2640']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendInner}
                >
                  <Ionicons name="arrow-up" size={20} color={palette.white} />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  messages: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  empty: { marginTop: spacing['3xl'], alignItems: 'center', paddingHorizontal: spacing.lg },
  starters: { marginTop: spacing.xl, gap: spacing.sm, alignSelf: 'stretch' },
  starterChip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairlineStrong,
    alignItems: 'center',
  },
  bubbleRow: { flexDirection: 'row' },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.lg },
  userBubble: { borderBottomRightRadius: 6 },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    borderBottomLeftRadius: 6,
  },
  inputWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.hairline,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairlineStrong,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 12,
    color: palette.textPrimary,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  sendBtn: { borderRadius: 23 },
  sendInner: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
