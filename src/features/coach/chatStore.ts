import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendChat, type ChatMessage } from './chat';

/**
 * Chat store — keeps a separate conversation per topic (physique, skincare,
 * general, etc.), persisted to AsyncStorage so threads survive restarts.
 */

type State = {
  conversations: Record<string, ChatMessage[]>;
  sending: boolean;
  hydrated: boolean;
};

const KEY = 'aurafy.chat.v1';
let state: State = { conversations: {}, sending: false, hydrated: false };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function persist() {
  AsyncStorage.setItem(KEY, JSON.stringify(state.conversations)).catch(() => {});
}
function setState(p: Partial<State>, save = true) {
  state = { ...state, ...p };
  emit();
  if (save) persist();
}

export const chatStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    return state;
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      setState({ conversations: raw ? JSON.parse(raw) : {}, hydrated: true }, false);
    } catch {
      setState({ hydrated: true }, false);
    }
  },

  messagesFor(topic: string): ChatMessage[] {
    return state.conversations[topic] ?? [];
  },

  async send(topic: string, topicLabel: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed || state.sending) return;
    const history = [...(state.conversations[topic] ?? []), { role: 'user' as const, content: trimmed }];
    setState({ conversations: { ...state.conversations, [topic]: history }, sending: true });

    const reply = await sendChat(topicLabel, history);
    setState({
      conversations: {
        ...state.conversations,
        [topic]: [...history, { role: 'assistant' as const, content: reply }],
      },
      sending: false,
    });
  },

  async wipe() {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setState({ conversations: {} }, false);
  },
};

export function useChat() {
  return useSyncExternalStore(chatStore.subscribe, chatStore.getSnapshot);
}
