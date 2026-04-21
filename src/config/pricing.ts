/**
 * Plan tiers configuration for SermonScriber.
 * Defines features and limits for each subscription tier.
 */

export type PlanTier = 'spark' | 'chapel' | 'parish' | 'cathedral';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
  limits: {
    sermonsPerMonth: number;
    minutesPerSermon: number;
    teamMembers: number;
    languages: number;
    storageGb: number;
  };
}

export const PRICING_PLANS: Record<PlanTier, PlanConfig> = {
  spark: {
    id: 'spark',
    name: 'Spark',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Perfect for trying out SermonScriber.',
    features: [
      '3 sermons per month',
      '30 minutes per sermon',
      'Basic transcription',
      'English only',
      'Email support',
    ],
    limits: {
      sermonsPerMonth: 3,
      minutesPerSermon: 30,
      teamMembers: 1,
      languages: 1,
      storageGb: 1,
    },
  },
  chapel: {
    id: 'chapel',
    name: 'Chapel',
    priceMonthly: 29,
    priceYearly: 290,
    description: 'Great for small churches getting started.',
    features: [
      '10 sermons per month',
      '60 minutes per sermon',
      'AI transcription',
      '2 languages',
      '2 team members',
      'Scripture detection',
      'Priority email support',
    ],
    limits: {
      sermonsPerMonth: 10,
      minutesPerSermon: 60,
      teamMembers: 2,
      languages: 2,
      storageGb: 10,
    },
  },
  parish: {
    id: 'parish',
    name: 'Parish',
    priceMonthly: 79,
    priceYearly: 790,
    description: 'For growing churches with active ministries.',
    features: [
      'Unlimited sermons',
      '90 minutes per sermon',
      'AI transcription + summaries',
      '5 languages',
      '10 team members',
      'Scripture detection',
      'Social media clips',
      'Chat support',
    ],
    limits: {
      sermonsPerMonth: -1, // unlimited
      minutesPerSermon: 90,
      teamMembers: 10,
      languages: 5,
      storageGb: 50,
    },
  },
  cathedral: {
    id: 'cathedral',
    name: 'Cathedral',
    priceMonthly: 199,
    priceYearly: 1990,
    description: 'For large churches and multi-site ministries.',
    features: [
      'Unlimited sermons',
      'Unlimited duration',
      'AI transcription + all content types',
      'Unlimited languages',
      'Unlimited team members',
      'Advanced scripture detection',
      'Custom branding',
      'API access',
      'Dedicated support',
    ],
    limits: {
      sermonsPerMonth: -1,
      minutesPerSermon: -1,
      teamMembers: -1,
      languages: -1,
      storageGb: 200,
    },
  },
};

export function getPlanById(id: PlanTier): PlanConfig {
  return PRICING_PLANS[id] ?? PRICING_PLANS.spark;
}
