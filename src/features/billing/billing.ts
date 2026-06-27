import Constants from 'expo-constants';
import { analysisStore } from '@/store/analysisStore';

/**
 * Billing — RevenueCat on top of Google Play Billing.
 *
 * RevenueCat is NOT a payment gateway; Google Play (which supports UPI/cards/
 * wallets for Indian users) processes the money, and RevenueCat manages the
 * subscriptions, receipts, and the "premium" entitlement across platforms.
 *
 * Expo Go has no native purchase module, so everything is wrapped defensively:
 * if RevenueCat can't initialise (Expo Go, or no API key yet) we fall back to a
 * MOCK unlock so the flow stays testable. Real purchases activate automatically
 * in a dev/production build once the API key + store products are configured.
 */

export type PlanId = 'weekly' | 'yearly' | 'lifetime';

export type Plan = {
  id: PlanId;
  title: string;
  price: string;
  subtitle?: string;
  badge?: string;
  highlighted?: boolean;
};

/**
 * Display plans (INR, tuned for accessibility + a strong yearly anchor). Once
 * RevenueCat is live these are superseded by the real, store-localised prices
 * from offerings — but they remain the labels/fallback.
 */
export const PLANS: Plan[] = [
  { id: 'weekly', title: 'Weekly', price: '₹119', subtitle: 'billed weekly' },
  {
    id: 'yearly',
    title: 'Yearly',
    price: '₹1,299',
    subtitle: 'just ₹25/week · save 79%',
    badge: 'BEST VALUE',
    highlighted: true,
  },
  { id: 'lifetime', title: 'Lifetime', price: '₹2,499', subtitle: 'one-time · pay once' },
];

export const PREMIUM_BENEFITS = [
  'Your AI "future self" transformation image',
  'Unlimited re-scans + instant full unlock',
  'Your complete, personalized glow-up plan',
  'All programs: physique, skin, height & posture',
  'Weekly progress tracking — no ads',
] as const;

const RC_KEY = (Constants.expoConfig?.extra as { revenueCatAndroidKey?: string } | undefined)
  ?.revenueCatAndroidKey;
const ENTITLEMENT = 'premium';

// Loaded lazily so Expo Go (which lacks the native module) never crashes.
let Purchases: typeof import('react-native-purchases').default | null = null;
let PACKAGE_TYPE: typeof import('react-native-purchases').PACKAGE_TYPE | null = null;
let rcReady = false;

async function ensureConfigured(): Promise<boolean> {
  if (rcReady) return true;
  if (!RC_KEY) return false;
  try {
    const mod = require('react-native-purchases');
    Purchases = mod.default;
    PACKAGE_TYPE = mod.PACKAGE_TYPE;
    await Purchases!.configure({ apiKey: RC_KEY });
    rcReady = true;
    // Sync any existing entitlement (e.g. a returning paid user).
    const info = await Purchases!.getCustomerInfo();
    if (info?.entitlements?.active?.[ENTITLEMENT]) analysisStore.setPremium(true);
    return true;
  } catch {
    rcReady = false;
    return false;
  }
}

function packageTypeFor(planId: PlanId) {
  if (!PACKAGE_TYPE) return null;
  return planId === 'weekly'
    ? PACKAGE_TYPE.WEEKLY
    : planId === 'yearly'
      ? PACKAGE_TYPE.ANNUAL
      : PACKAGE_TYPE.LIFETIME;
}

export const billing = {
  /** Initialise RevenueCat at app start (no-op in Expo Go / without a key). */
  async configure() {
    await ensureConfigured();
  },

  async getPlans(): Promise<Plan[]> {
    return PLANS;
  },

  async purchase(planId: PlanId): Promise<{ success: boolean }> {
    const ready = await ensureConfigured();
    if (!ready || !Purchases) {
      // Mock unlock (Expo Go / not yet configured) so the flow is testable.
      await new Promise((r) => setTimeout(r, 800));
      analysisStore.setPremium(true);
      return { success: true };
    }
    try {
      const offerings = await Purchases.getOfferings();
      const pkgs = offerings.current?.availablePackages ?? [];
      const wantType = packageTypeFor(planId);
      const pkg = pkgs.find((p) => p.packageType === wantType) ?? pkgs[0];
      if (!pkg) throw new Error('No package available');
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = !!customerInfo?.entitlements?.active?.[ENTITLEMENT];
      analysisStore.setPremium(active);
      return { success: active };
    } catch {
      return { success: false };
    }
  },

  async restore(): Promise<{ restored: boolean }> {
    const ready = await ensureConfigured();
    if (!ready || !Purchases) return { restored: false };
    try {
      const info = await Purchases.restorePurchases();
      const active = !!info?.entitlements?.active?.[ENTITLEMENT];
      analysisStore.setPremium(active);
      return { restored: active };
    } catch {
      return { restored: false };
    }
  },

  isConfigured() {
    return rcReady;
  },
};
