import Constants from 'expo-constants';
import { profileStore } from '@/features/profile/profileStore';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

const ENDPOINT =
  process.env.EXPO_PUBLIC_AI_ENDPOINT ||
  (Constants.expoConfig?.extra as { aiEndpoint?: string } | undefined)?.aiEndpoint;
const CHAT_ENDPOINT = ENDPOINT ? ENDPOINT.replace(/\/analyze\/?$/, '/chat') : undefined;

/** Build a compact profile + topic context string for the chat system prompt. */
function buildContext(topicLabel: string): string {
  const { profile } = profileStore.getSnapshot();
  const p: string[] = [];
  if (profile.ageRange) p.push(`age ${profile.ageRange}`);
  if (profile.gender) p.push(profile.gender);
  if (profile.heightCm) p.push(`${profile.heightCm}cm`);
  if (profile.weightKg) p.push(`${profile.weightKg}kg`);
  if (profile.bodyType) p.push(`${profile.bodyType} build`);
  if (profile.trainingPlace) p.push(`trains at ${profile.trainingPlace}`);
  if (profile.diet) p.push(`${profile.diet} diet`);
  if (profile.goals?.length) p.push(`goals: ${profile.goals.join(', ')}`);
  if (profile.coachVibe) p.push(`prefers a ${profile.coachVibe} tone`);
  const who = p.length ? `User: ${p.join(', ')}.` : '';
  return `${who} This conversation is about: ${topicLabel}.`;
}

export async function sendChat(topicLabel: string, messages: ChatMessage[]): Promise<string> {
  if (CHAT_ENDPOINT) {
    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, context: buildContext(topicLabel) }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.reply) return String(json.reply);
      }
    } catch {
      /* fall through */
    }
  }
  await new Promise((r) => setTimeout(r, 700));
  return "I'm having trouble reaching the coach right now. Please check your connection and try again.";
}
