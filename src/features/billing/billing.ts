import { analysisStore } from '@/store/analysisStore';

/**
 * Billing abstraction.
 *
 * The UI talks only to this module, never to a vendor SDK directly. Today it's
 * a mock that flips the local premium flag; to go live we install
 * `react-native-purchases` (RevenueCat) and implement these four functions
 * against it — no screen changes required.
 *
 *   configure()  -> Purchases.configure({ apiKey })
 *   getOfferings -> Purchases.getOfferings()
 *   purchase()   -> Purchases.purchasePackage(pkg)
 *   restore()    -> Purchases.restorePurchases()
 */

export type PlanId = 'weekly' | 'yearly' | 'lifetime';

export type Plan = {
  id: PlanId;
  title: string;
  price: string;
  /** Sub-line, e.g. per-week breakdown for annual. */
  subtitle?: string;
  badge?: string;
  /** Marks the option pre-selected + visually emphasized. */
  highlighted?: boolean;
};

/**
 * Display plans. Prices here are placeholders for the UI; the real prices come
 * from the store via RevenueCat offerings once wired. Pricing tuned for the
 * looksmaxxing niche (low weekly anchor + a clearly cheaper annual).
 */
export const PLANS: Plan[] = [
  { id: 'weekly', title: 'Weekly', price: '₹149', subtitle: 'billed weekly' },
  {
    id: 'yearly',
    title: 'Yearly',
    price: '₹2,499',
    subtitle: 'just ₹48/week',
    badge: 'BEST VALUE',
    highlighted: true,
  },
  { id: 'lifetime', title: 'Lifetime', price: '₹4,999', subtitle: 'one-time' },
];

export const PREMIUM_BENEFITS = [
  'Your complete, personalized glow-up plan',
  'Unlimited re-scans & weekly progress tracking',
  'Deep feature insights & potential breakdown',
  'Exclusive premium aura share cards',
  'Priority new features, no ads',
] as const;

let configured = false;

export const billing = {
  async configure() {
    // TODO(real): Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_KEY })
    configured = true;
  },

  async getPlans(): Promise<Plan[]> {
    // TODO(real): map Purchases.getOfferings() -> Plan[]
    return PLANS;
  },

  async purchase(planId: PlanId): Promise<{ success: boolean }> {
    // TODO(real): await Purchases.purchasePackage(pkg) and read entitlements.
    await new Promise((r) => setTimeout(r, 900));
    analysisStore.setPremium(true);
    return { success: true };
  },

  async restore(): Promise<{ restored: boolean }> {
    // TODO(real): const info = await Purchases.restorePurchases()
    await new Promise((r) => setTimeout(r, 700));
    return { restored: false };
  },

  isConfigured() {
    return configured;
  },
};
