import type { MemoryItem, Decision, Commitment, Blocker, Metric, Provenance } from '../types';

// Helper to construct ISO timestamps relative to current time for realism
const daysAgo = (days: number, hours = 10): string => {
  const date = new Date('2026-06-14T21:55:00Z');
  date.setDate(date.getDate() - days);
  date.setHours(hours);
  return date.toISOString();
};

export const MOCK_MEMORIES: MemoryItem[] = [
  // --- PAIR 1: Authentication failure & Launch delay ---
  {
    id: 'blocker-1',
    type: 'Blocker',
    title: 'Cognito authentication service failing in staging environment',
    content: 'The auth service is failing to redirect users back after successful sign-in, returning a 502 Bad Gateway error. This blocks the final QA review.',
    timestamp: daysAgo(5, 9),
    provenance: {
      source: 'Linear',
      author: 'Alex Rivera (Tech Lead)',
      timestamp: daysAgo(5, 9),
      message_id: 'LIN-9021',
      link_to_source: 'https://linear.app/founderops/issue/FO-902',
      raw_content: 'Cognito Auth redirect loop in staging. Blocking marketing team QA.'
    },
    blockerDetails: {
      id: 'blocker-1',
      issue: 'Cognito authentication service failure in staging',
      severity: 'High',
      status: 'Open',
      provenance: {
        source: 'Linear',
        author: 'Alex Rivera (Tech Lead)',
        timestamp: daysAgo(5, 9),
        message_id: 'LIN-9021',
        link_to_source: 'https://linear.app/founderops/issue/FO-902'
      }
    }
  },
  {
    id: 'metric-1',
    type: 'Metric',
    title: 'Beta Sign-up Conversion Rate dropped to 12%',
    content: 'Stripe and posthog reports show that sign-up conversion has dropped from 24% to 12% following the authentication timeouts in our staging/public beta trials.',
    timestamp: daysAgo(4, 10),
    provenance: {
      source: 'Stripe',
      author: 'Stripe Ingestion Daemon',
      timestamp: daysAgo(4, 10),
      message_id: 'STR-9810',
      link_to_source: 'https://stripe.com/founderops/analytics/metrics_981',
      raw_content: 'Web signup conversion rate: 12% (down from 24% week-over-week).'
    },
    metricDetails: {
      id: 'metric-1',
      name: 'Beta Sign-up Conversion Rate',
      old_value: '24%',
      new_value: '12%',
      change: '-50%',
      provenance: {
        source: 'Stripe',
        author: 'Stripe Ingest',
        timestamp: daysAgo(4, 10),
        message_id: 'STR-9810',
        link_to_source: 'https://stripe.com/founderops/analytics/metrics_981'
      }
    }
  },
  {
    id: 'decision-1',
    type: 'Decision',
    title: 'Postpone public beta launch by one week',
    content: 'We decided to push our public beta launch date from June 12 to June 19 to fix the Cognito auth redirect loops and restore sign-up conversion rates.',
    timestamp: daysAgo(4, 14),
    provenance: {
      source: 'Slack',
      author: 'Sarah Jenkins (Founder & CEO)',
      timestamp: daysAgo(4, 14),
      message_id: 'SLK-20192',
      link_to_source: 'https://slack.com/founderops/archives/C03452/p162983',
      raw_content: "Sarah: Let's postpone the beta launch by one week until the authentication issues are resolved. We can't onboard users with a broken sign-up flow."
    },
    decisionDetails: {
      id: 'decision-1',
      decision: 'Postpone beta launch by one week',
      reason: 'Cognito authentication service is failing in staging, causing conversion rates to crash to 12%.',
      date: '2026-06-10',
      blockerIds: ['blocker-1'],
      metricIds: ['metric-1'],
      provenance: {
        source: 'Slack',
        author: 'Sarah Jenkins (Founder & CEO)',
        timestamp: daysAgo(4, 14),
        message_id: 'SLK-20192',
        link_to_source: 'https://slack.com/founderops/archives/C03452/p162983'
      }
    }
  },
  {
    id: 'commitment-1',
    type: 'Commitment',
    title: 'Send beta delay update to Lead Investor',
    content: 'Send email to Ardent Ventures explaining the launch delay reasons, Cognito blockers, and the revised launch timeline.',
    timestamp: daysAgo(4, 15),
    provenance: {
      source: 'Gmail',
      author: 'Sarah Jenkins (Founder & CEO)',
      timestamp: daysAgo(4, 15),
      message_id: 'GML-0192',
      link_to_source: 'https://mail.google.com/mail/u/0/#inbox/18ab3f902c',
      raw_content: 'Sarah to Mark (Ardent): I will send you a detailed breakdown of the staging blockers and the new timeline by tomorrow.'
    },
    commitmentDetails: {
      id: 'commitment-1',
      owner: 'Sarah Jenkins',
      task: 'Send beta delay update email to Ardent Ventures',
      deadline: daysAgo(3, 17),
      status: 'Fulfilled',
      decisionId: 'decision-1',
      provenance: {
        source: 'Gmail',
        author: 'Sarah Jenkins (Founder & CEO)',
        timestamp: daysAgo(4, 15),
        message_id: 'GML-0192',
        link_to_source: 'https://mail.google.com/mail/u/0/#inbox/18ab3f902c'
      }
    }
  },
  {
    id: 'commitment-2',
    type: 'Commitment',
    title: 'Deploy hotfix for AWS Cognito client credentials wrapper',
    content: 'Rewrite the OAuth callback routing wrapper in the next-auth configuration and deploy to staging for QA verification.',
    timestamp: daysAgo(4, 16),
    provenance: {
      source: 'Slack',
      author: 'Alex Rivera (Tech Lead)',
      timestamp: daysAgo(4, 16),
      message_id: 'SLK-8812',
      link_to_source: 'https://slack.com/founderops/archives/C03452/p162989',
      raw_content: 'Alex: I will write the hotfix wrapper tonight and have it pushed to staging by tomorrow morning.'
    },
    commitmentDetails: {
      id: 'commitment-2',
      owner: 'Alex Rivera',
      task: 'Deploy hotfix for AWS Cognito staging auth client',
      deadline: daysAgo(3, 12),
      status: 'Fulfilled',
      decisionId: 'decision-1',
      provenance: {
        source: 'Slack',
        author: 'Alex Rivera (Tech Lead)',
        timestamp: daysAgo(4, 16),
        message_id: 'SLK-8812',
        link_to_source: 'https://slack.com/founderops/archives/C03452/p162989'
      }
    }
  },

  // --- PAIR 2: PRICING DECISION & MRR IMPACT ---
  {
    id: 'metric-2',
    type: 'Metric',
    title: 'Average Contract Value (ACV) increased from $1,200 to $1,800',
    content: 'Operational analysis of initial corporate agreements shows early expansion, prompting team discussion around shifting to flat enterprise seat pricing.',
    timestamp: daysAgo(12, 9),
    provenance: {
      source: 'Stripe',
      author: 'Stripe Billing System',
      timestamp: daysAgo(12, 9),
      message_id: 'STR-4412',
      link_to_source: 'https://stripe.com/founderops/analytics/acv_reports',
      raw_content: 'Average contract value reached $1,800 after corporate cohort launch.'
    },
    metricDetails: {
      id: 'metric-2',
      name: 'Average Contract Value (ACV)',
      old_value: 1200,
      new_value: 1800,
      change: '+50%',
      provenance: {
        source: 'Stripe',
        author: 'Stripe System',
        timestamp: daysAgo(12, 9),
        message_id: 'STR-4412',
        link_to_source: 'https://stripe.com/founderops/analytics/acv_reports'
      }
    }
  },
  {
    id: 'blocker-2',
    type: 'Blocker',
    title: 'Customer churn risk in basic tier due to lack of self-serve export',
    content: 'Multiple user feedback emails express frustration over their inability to export knowledge graphs to PDF or markdown. Three startup accounts threatened to cancel.',
    timestamp: daysAgo(11, 10),
    provenance: {
      source: 'Gmail',
      author: 'Support Inbox (Zendesk Sync)',
      timestamp: daysAgo(11, 10),
      message_id: 'GML-9921',
      link_to_source: 'https://mail.google.com/mail/u/0/#inbox/18ad9990',
      raw_content: 'Customer Feedback: "We love the dashboard but without CSV/PDF export, we cannot present reports to our board. We might need to cancel next month."'
    },
    blockerDetails: {
      id: 'blocker-2',
      issue: 'Lack of self-serve export options causing customer churn risk',
      severity: 'Medium',
      status: 'Open',
      provenance: {
        source: 'Gmail',
        author: 'Support Inbox',
        timestamp: daysAgo(11, 10),
        message_id: 'GML-9921',
        link_to_source: 'https://mail.google.com/mail/u/0/#inbox/18ad9990'
      }
    }
  },
  {
    id: 'decision-2',
    type: 'Decision',
    title: 'Transition Pro plan to seats-based pricing & add self-serve export',
    content: 'We decided to deprecate flat monthly rates for the Pro tier, shifting to $49/seat/month pricing, and prioritized building raw export formats to curb churn.',
    timestamp: daysAgo(10, 15),
    provenance: {
      source: 'Notion',
      author: 'Sarah Jenkins (Founder & CEO)',
      timestamp: daysAgo(10, 15),
      message_id: 'NOT-1029',
      link_to_source: 'https://notion.so/founderops/Product-Pricing-Refactor-2026',
      raw_content: 'Meeting notes on product pricing: Shifting Pro to $49/seat. Incorporating data exports in sprint 14.'
    },
    decisionDetails: {
      id: 'decision-2',
      decision: 'Shift Pro pricing to $49/seat/month and build data exports',
      reason: 'Leveraging positive ACV trajectory ($1,200 to $1,800) and resolving basic-tier churn threats by offering immediate reporting tools.',
      date: '2026-06-04',
      blockerIds: ['blocker-2'],
      metricIds: ['metric-2'],
      provenance: {
        source: 'Notion',
        author: 'Sarah Jenkins (Founder & CEO)',
        timestamp: daysAgo(10, 15),
        message_id: 'NOT-1029',
        link_to_source: 'https://notion.so/founderops/Product-Pricing-Refactor-2026'
      }
    }
  },
  {
    id: 'commitment-3',
    type: 'Commitment',
    title: 'Update Stripe billing scripts to reflect per-seat charges',
    content: 'Modify Stripe subscription creation logic to send subscription items with quantities based on active team seats.',
    timestamp: daysAgo(10, 16),
    provenance: {
      source: 'Linear',
      author: 'Alex Rivera (Tech Lead)',
      timestamp: daysAgo(10, 16),
      message_id: 'LIN-1028',
      link_to_source: 'https://linear.app/founderops/issue/FO-102',
      raw_content: 'Alex: Billing hooks update for Stripe seats. Will finalize subscription webhooks.'
    },
    commitmentDetails: {
      id: 'commitment-3',
      owner: 'Alex Rivera',
      task: 'Refactor Stripe subscription webhooks for per-seat billing model',
      deadline: daysAgo(7, 18),
      status: 'Fulfilled',
      decisionId: 'decision-2',
      provenance: {
        source: 'Linear',
        author: 'Alex Rivera (Tech Lead)',
        timestamp: daysAgo(10, 16),
        message_id: 'LIN-1028',
        link_to_source: 'https://linear.app/founderops/issue/FO-102'
      }
    }
  },

  // --- PAIR 3: HEADCOUNT EXPANSION & GITHUB BOTTLENECK ---
  {
    id: 'blocker-3',
    type: 'Blocker',
    title: 'Engineering team deployment bottleneck on Github Actions',
    content: 'CI/CD pipeline runs are queued for up to 45 minutes because of standard GitHub runner concurrency limits, severely slowing down feature testing.',
    timestamp: daysAgo(15, 8),
    provenance: {
      source: 'Slack',
      author: 'Marcus Chen (Senior DevOps)',
      timestamp: daysAgo(15, 8),
      message_id: 'SLK-99212',
      link_to_source: 'https://slack.com/founderops/archives/C03452/p162112',
      raw_content: 'Marcus: GitHub actions queue is out of control today. We are waiting 40 minutes for a standard build.'
    },
    blockerDetails: {
      id: 'blocker-3',
      issue: 'GitHub runner concurrency limits blocking dev cycles',
      severity: 'Medium',
      status: 'Resolved',
      provenance: {
        source: 'Slack',
        author: 'Marcus Chen (Senior DevOps)',
        timestamp: daysAgo(15, 8),
        message_id: 'SLK-99212',
        link_to_source: 'https://slack.com/founderops/archives/C03452/p162112'
      }
    }
  },
  {
    id: 'metric-3',
    type: 'Metric',
    title: 'Monthly Active Users (MAU) increased to 4,200',
    content: 'User traction grows over 20% in the last month, stressing infrastructure stability and developer velocity.',
    timestamp: daysAgo(14, 9),
    provenance: {
      source: 'Stripe',
      author: 'System Analytics Daemon',
      timestamp: daysAgo(14, 9),
      message_id: 'STR-0021',
      link_to_source: 'https://stripe.com/founderops/analytics/mau_june',
      raw_content: 'MAU reports hit 4,200 users, up from 3,500.'
    },
    metricDetails: {
      id: 'metric-3',
      name: 'Monthly Active Users (MAU)',
      old_value: 3500,
      new_value: 4200,
      change: '+20%',
      provenance: {
        source: 'Stripe',
        author: 'System Analytics',
        timestamp: daysAgo(14, 9),
        message_id: 'STR-0021',
        link_to_source: 'https://stripe.com/founderops/analytics/mau_june'
      }
    }
  },
  {
    id: 'decision-3',
    type: 'Decision',
    title: 'Approve migration to self-hosted AWS EC2 runners',
    content: 'Moved engineering CI/CD workflows to self-hosted AWS EC2 instances. This eliminates runner queues and scales capacity with our developer velocity.',
    timestamp: daysAgo(13, 14),
    provenance: {
      source: 'Notion',
      author: 'Sarah Jenkins (Founder & CEO)',
      timestamp: daysAgo(13, 14),
      message_id: 'NOT-0091',
      link_to_source: 'https://notion.so/founderops/Infrastructure-Scaling-Decisions',
      raw_content: 'Decision: Migrating to self-hosted AWS runner scaling group to resolve git build bottlenecks.'
    },
    decisionDetails: {
      id: 'decision-3',
      decision: 'Migrate to self-hosted AWS runner group',
      reason: 'Clearing 45-minute build queues to preserve engineering productivity as MAU and codebase size scale rapidly.',
      date: '2026-06-01',
      blockerIds: ['blocker-3'],
      metricIds: ['metric-3'],
      provenance: {
        source: 'Notion',
        author: 'Sarah Jenkins (Founder & CEO)',
        timestamp: daysAgo(13, 14),
        message_id: 'NOT-0091',
        link_to_source: 'https://notion.so/founderops/Infrastructure-Scaling-Decisions'
      }
    }
  },
  {
    id: 'commitment-4',
    type: 'Commitment',
    title: 'Configure Terraform scripts for AWS EC2 autoscaling runner groups',
    content: 'Review and merge Marcus Chen\'s infrastructure PR to launch autoscaling self-hosted GitHub actions runner instances.',
    timestamp: daysAgo(13, 16),
    provenance: {
      source: 'Slack',
      author: 'Marcus Chen (Senior DevOps)',
      timestamp: daysAgo(13, 16),
      message_id: 'SLK-22123',
      link_to_source: 'https://slack.com/founderops/archives/C03452/p162118',
      raw_content: 'Marcus: I will post the Terraform changes for review this evening.'
    },
    commitmentDetails: {
      id: 'commitment-4',
      owner: 'Marcus Chen',
      task: 'Merge and provision AWS auto-scaling runner group via Terraform',
      deadline: daysAgo(11, 17),
      status: 'Fulfilled',
      decisionId: 'decision-3',
      provenance: {
        source: 'Slack',
        author: 'Marcus Chen (Senior DevOps)',
        timestamp: daysAgo(13, 16),
        message_id: 'SLK-22123',
        link_to_source: 'https://slack.com/founderops/archives/C03452/p162118'
      }
    }
  },

  // --- PAIR 4: MOBILE APP DELAY & APP STORE REJECTION ---
  {
    id: 'blocker-4',
    type: 'Blocker',
    title: 'App Store rejection due to user data disclosure policy clarification',
    content: 'Apple Review Team rejected iOS submission v1.0.4. They require an explicit update to the privacy policy regarding third-party workspace integrations.',
    timestamp: daysAgo(8, 9),
    provenance: {
      source: 'Gmail',
      author: 'App Store Connect',
      timestamp: daysAgo(8, 9),
      message_id: 'GML-88122',
      link_to_source: 'https://mail.google.com/mail/u/0/#inbox/18ad981b',
      raw_content: 'App Store Review: Submission rejected. Ref: Guideline 5.1.1 - Data Collection and Storage.'
    },
    blockerDetails: {
      id: 'blocker-4',
      issue: 'Apple App Store rejection on Guideline 5.1.1',
      severity: 'High',
      status: 'Open',
      provenance: {
        source: 'Gmail',
        author: 'App Store Connect',
        timestamp: daysAgo(8, 9),
        message_id: 'GML-88122',
        link_to_source: 'https://mail.google.com/mail/u/0/#inbox/18ad981b'
      }
    }
  },
  {
    id: 'metric-4',
    type: 'Metric',
    title: 'Beta customer feedback score decreased from 4.7 to 4.1',
    content: 'Weekly survey results dropped due to users requesting the mobile application and showing fatigue around desktop-only interfaces.',
    timestamp: daysAgo(7, 10),
    provenance: {
      source: 'Notion',
      author: 'Sarah Jenkins (Founder & CEO)',
      timestamp: daysAgo(7, 10),
      message_id: 'NOT-9912',
      link_to_source: 'https://notion.so/founderops/Surveys-June-2026',
      raw_content: 'NPS/Feedback score hit 4.1. The primary detractor is "No mobile client available."'
    },
    metricDetails: {
      id: 'metric-4',
      name: 'NPS Beta Customer Feedback Score',
      old_value: 4.7,
      new_value: 4.1,
      change: '-12.7%',
      provenance: {
        source: 'Notion',
        author: 'Sarah Jenkins (Founder & CEO)',
        timestamp: daysAgo(7, 10),
        message_id: 'NOT-9912',
        link_to_source: 'https://notion.so/founderops/Surveys-June-2026'
      }
    }
  },
  {
    id: 'decision-5',
    type: 'Decision',
    title: 'Revise Mobile Privacy Policy and resubmit iOS binary',
    content: 'We drafted an explicit disclosure section detailing how workspace emails are sandboxed locally. Re-submitting the app to Apple Connect.',
    timestamp: daysAgo(7, 15),
    provenance: {
      source: 'Slack',
      author: 'Sarah Jenkins (Founder & CEO)',
      timestamp: daysAgo(7, 15),
      message_id: 'SLK-55123',
      link_to_source: 'https://slack.com/founderops/archives/C03452/p162124',
      raw_content: 'Sarah: Let\'s re-write the privacy page on our website today, link it in the app submission, and resubmit. We cannot afford to slip the mobile release.'
    },
    decisionDetails: {
      id: 'decision-5',
      decision: 'Revise privacy clause and resubmit iOS client',
      reason: 'App Store rejection is blocking our mobile release, directly driving customer satisfaction scores down to 4.1.',
      date: '2026-06-07',
      blockerIds: ['blocker-4'],
      metricIds: ['metric-4'],
      provenance: {
        source: 'Slack',
        author: 'Sarah Jenkins (Founder & CEO)',
        timestamp: daysAgo(7, 15),
        message_id: 'SLK-55123',
        link_to_source: 'https://slack.com/founderops/archives/C03452/p162124'
      }
    }
  },
  {
    id: 'commitment-5',
    type: 'Commitment',
    title: 'Publish updated privacy policy to landing page website',
    content: 'Create a new `/privacy-mobile` page and publish it, ensuring the legal language satisfies the Apple Guideline 5.1.1 requirements.',
    timestamp: daysAgo(7, 16),
    provenance: {
      source: 'Slack',
      author: 'Sarah Jenkins (Founder & CEO)',
      timestamp: daysAgo(7, 16),
      message_id: 'SLK-55129',
      link_to_source: 'https://slack.com/founderops/archives/C03452/p162128',
      raw_content: 'Sarah: I will review and update the legal page copy on our landing page repository by this afternoon.'
    },
    commitmentDetails: {
      id: 'commitment-5',
      owner: 'Sarah Jenkins',
      task: 'Draft and publish updated mobile integration privacy terms online',
      deadline: daysAgo(6, 12),
      status: 'Fulfilled',
      decisionId: 'decision-5',
      provenance: {
        source: 'Slack',
        author: 'Sarah Jenkins (Founder & CEO)',
        timestamp: daysAgo(7, 16),
        message_id: 'SLK-55129',
        link_to_source: 'https://slack.com/founderops/archives/C03452/p162128'
      }
    }
  },
  {
    id: 'commitment-6',
    type: 'Commitment',
    title: 'Resubmit app build on App Store Connect panel',
    content: 'Upload app metadata revisions referencing the privacy link, and resubmit the binary for review.',
    timestamp: daysAgo(7, 17),
    provenance: {
      source: 'Slack',
      author: 'Alex Rivera (Tech Lead)',
      timestamp: daysAgo(7, 17),
      message_id: 'SLK-55135',
      link_to_source: 'https://slack.com/founderops/archives/C03452/p162135',
      raw_content: 'Alex: I will handle the App Store Connect submission details once the privacy page link is live.'
    },
    commitmentDetails: {
      id: 'commitment-6',
      owner: 'Alex Rivera',
      task: 'Submit App Store Connect review information with privacy disclosures',
      deadline: daysAgo(6, 17),
      status: 'Fulfilled',
      decisionId: 'decision-5',
      provenance: {
        source: 'Slack',
        author: 'Alex Rivera (Tech Lead)',
        timestamp: daysAgo(7, 17),
        message_id: 'SLK-55135',
        link_to_source: 'https://slack.com/founderops/archives/C03452/p162135'
      }
    }
  },

  // --- PAIR 5: CUSTOMER REVENUE EXPANSION & TRIAL PERIODS ---
  {
    id: 'metric-5',
    type: 'Metric',
    title: 'Stripe MRR increased from $8,400 to $10,500',
    content: 'Stripe analytics indicate that our monthly recurring revenue surpassed $10k following subscription conversions from our first pilot batch.',
    timestamp: daysAgo(2, 9),
    provenance: {
      source: 'Stripe',
      author: 'Stripe Billing System',
      timestamp: daysAgo(2, 9),
      message_id: 'STR-1092',
      link_to_source: 'https://stripe.com/founderops/analytics/mrr_june_12',
      raw_content: 'MRR: $10,500 (+25% growth, cross-over 10k threshold).'
    },
    metricDetails: {
      id: 'metric-5',
      name: 'Monthly Recurring Revenue (MRR)',
      old_value: 8400,
      new_value: 10500,
      change: '+25%',
      provenance: {
        source: 'Stripe',
        author: 'Stripe System',
        timestamp: daysAgo(2, 9),
        message_id: 'STR-1092',
        link_to_source: 'https://stripe.com/founderops/analytics/mrr_june_12'
      }
    }
  },
  {
    id: 'blocker-5',
    type: 'Blocker',
    title: 'High support load on manual onboarding workflows',
    content: 'Onboarding queue is exceeding 48 hours for new users because we are manually provisioning their TrustClaw sandboxes. Founders complain about delays.',
    timestamp: daysAgo(3, 11),
    provenance: {
      source: 'Gmail',
      author: 'Sarah Jenkins (Founder & CEO)',
      timestamp: daysAgo(3, 11),
      message_id: 'GML-00213',
      link_to_source: 'https://mail.google.com/mail/u/0/#inbox/18ae001',
      raw_content: 'We have 42 users waiting in queue. It takes 15 minutes per user to verify keys and activate TrustClaw accounts manually.'
    },
    blockerDetails: {
      id: 'blocker-5',
      issue: 'Manual setup of secure execution environment creates onboarding queue',
      severity: 'High',
      status: 'Open',
      provenance: {
        source: 'Gmail',
        author: 'Sarah Jenkins (Founder & CEO)',
        timestamp: daysAgo(3, 11),
        message_id: 'GML-00213',
        link_to_source: 'https://mail.google.com/mail/u/0/#inbox/18ae001'
      }
    }
  },
  {
    id: 'decision-6',
    type: 'Decision',
    title: 'Deploy Automated Provisioning API for TrustClaw Sandboxes',
    content: 'We decided to prioritize automated environment scheduling. We allocated backend resources to write a cron queue script for sandbox activations.',
    timestamp: daysAgo(2, 14),
    provenance: {
      source: 'Slack',
      author: 'Sarah Jenkins (Founder & CEO)',
      timestamp: daysAgo(2, 14),
      message_id: 'SLK-90021',
      link_to_source: 'https://slack.com/founderops/archives/C03452/p162180',
      raw_content: 'Sarah: We have the revenue growth ($10.5k MRR) to justify scaling. Let\'s build the auto-sandbox provisioning script this sprint.'
    },
    decisionDetails: {
      id: 'decision-6',
      decision: 'Automate TrustClaw sandbox provisioning pipeline',
      reason: 'Resolving the onboarding logjam (48-hour queue) and capitalizing on our $10k+ MRR momentum.',
      date: '2026-06-12',
      blockerIds: ['blocker-5'],
      metricIds: ['metric-5'],
      provenance: {
        source: 'Slack',
        author: 'Sarah Jenkins (Founder & CEO)',
        timestamp: daysAgo(2, 14),
        message_id: 'SLK-90021',
        link_to_source: 'https://slack.com/founderops/archives/C03452/p162180'
      }
    }
  },
  {
    id: 'commitment-7',
    type: 'Commitment',
    title: 'Draft sandbox provisioning script and webhooks',
    content: 'Build the backend endpoint that triggers upon Stripe checkouts to programmatically register and spawn the isolation layer.',
    timestamp: daysAgo(2, 16),
    provenance: {
      source: 'Linear',
      author: 'Alex Rivera (Tech Lead)',
      timestamp: daysAgo(2, 16),
      message_id: 'LIN-00912',
      link_to_source: 'https://linear.app/founderops/issue/FO-903',
      raw_content: 'Alex: Will write the webhook integration scripts and endpoint endpoints for sandbox setup automation.'
    },
    commitmentDetails: {
      id: 'commitment-7',
      owner: 'Alex Rivera',
      task: 'Implement Stripe-to-TrustClaw sandbox provisioning API webhook',
      deadline: daysAgo(0, 18), // Due today
      status: 'Open',
      decisionId: 'decision-6',
      provenance: {
        source: 'Linear',
        author: 'Alex Rivera (Tech Lead)',
        timestamp: daysAgo(2, 16),
        message_id: 'LIN-00912',
        link_to_source: 'https://linear.app/founderops/issue/FO-903'
      }
    }
  },

  // --- ADDITIONAL STANDALONE AND HISTORICAL RECORDS (TO DOCK OVER 50 TOTAL ITEMS) ---
  // BLOCKERS (8 more)
  {
    id: 'blocker-6',
    type: 'Blocker',
    title: 'Gmail API rate limits restricting background message ingest',
    content: 'Google Workspace API quota limits triggered because we are sync polling user messages hourly. We are hitting the 250 requests per minute limit.',
    timestamp: daysAgo(3, 8),
    provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(3, 8), message_id: 'MSG-B6', link_to_source: '#' },
    blockerDetails: { id: 'blocker-6', issue: 'Gmail API Rate Limits triggered during background sync', severity: 'Medium', status: 'Open', provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(3, 8), message_id: 'MSG-B6', link_to_source: '#' } }
  },
  {
    id: 'blocker-7',
    type: 'Blocker',
    title: 'Slack App verification review delayed by Security Board',
    content: 'The Slack review team rejected our app listing, requesting a clean, dedicated demo video showing sandbox security in action.',
    timestamp: daysAgo(6, 11),
    provenance: { source: 'Gmail', author: 'Slack App Directory', timestamp: daysAgo(6, 11), message_id: 'MSG-B7', link_to_source: '#' },
    blockerDetails: { id: 'blocker-7', issue: 'Slack App Store listing verification rejection', severity: 'Medium', status: 'Open', provenance: { source: 'Gmail', author: 'Slack App Directory', timestamp: daysAgo(6, 11), message_id: 'MSG-B7', link_to_source: '#' } }
  },
  {
    id: 'blocker-8',
    type: 'Blocker',
    title: 'Customer database slow query degradation during search lookups',
    content: 'Postgres instances are spiking to 100% CPU when users search their extracted memory systems due to missing indexes on metadata JSON fields.',
    timestamp: daysAgo(9, 14),
    provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(9, 14), message_id: 'MSG-B8', link_to_source: '#' },
    blockerDetails: { id: 'blocker-8', issue: 'Database high CPU spikes during full-text memory lookup searches', severity: 'High', status: 'Resolved', provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(9, 14), message_id: 'MSG-B8', link_to_source: '#' } }
  },
  {
    id: 'blocker-9',
    type: 'Blocker',
    title: 'SSL certificate renewal timeout on custom subdomains',
    content: 'Let\'s Encrypt client failed to renew certificates for custom domains. Users mapping custom aliases are seeing secure page warnings.',
    timestamp: daysAgo(10, 8),
    provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(10, 8), message_id: 'MSG-B9', link_to_source: '#' },
    blockerDetails: { id: 'blocker-9', issue: 'SSL certificate renewal script timeout for custom user domains', severity: 'High', status: 'Resolved', provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(10, 8), message_id: 'MSG-B9', link_to_source: '#' } }
  },
  {
    id: 'blocker-10',
    type: 'Blocker',
    title: 'Composio token expiration under high concurrency loads',
    content: 'AccessToken values expire prematurely. Under heavy load, users are forced to re-link Notion integrations multiple times.',
    timestamp: daysAgo(1, 10),
    provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(1, 10), message_id: 'MSG-B10', link_to_source: '#' },
    blockerDetails: { id: 'blocker-10', issue: 'Composio integration access tokens expiring prematurely', severity: 'High', status: 'Open', provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(1, 10), message_id: 'MSG-B10', link_to_source: '#' } }
  },
  {
    id: 'blocker-11',
    type: 'Blocker',
    title: 'Calendar sync event duplication bugs',
    content: 'Recurring calendar events are generating duplicates in the ingestion layer, bloating database storage and pipeline runtime.',
    timestamp: daysAgo(11, 15),
    provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(11, 15), message_id: 'MSG-B11', link_to_source: '#' },
    blockerDetails: { id: 'blocker-11', issue: 'Ingestion parsing duplicates recurring calendar meetings', severity: 'Low', status: 'Resolved', provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(11, 15), message_id: 'MSG-B11', link_to_source: '#' } }
  },
  {
    id: 'blocker-12',
    type: 'Blocker',
    title: 'Beta customer feedback reports missing Notion connector pages',
    content: 'Notion OAuth page picker restricts access to specific workspaces, preventing the extraction pipeline from finding shared PR wikis.',
    timestamp: daysAgo(13, 9),
    provenance: { source: 'Gmail', author: 'Feedback Form', timestamp: daysAgo(13, 9), message_id: 'MSG-B12', link_to_source: '#' },
    blockerDetails: { id: 'blocker-12', issue: 'Notion page selection filter limits ingestion parsing scope', severity: 'Low', status: 'Resolved', provenance: { source: 'Gmail', author: 'Feedback Form', timestamp: daysAgo(13, 9), message_id: 'MSG-B12', link_to_source: '#' } }
  },
  {
    id: 'blocker-13',
    type: 'Blocker',
    title: 'Vercel deployment bundle sizes warning limits',
    content: 'Production bundle builds exceeded 2MB, triggering a build warnings and slowing client page loads.',
    timestamp: daysAgo(14, 11),
    provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(14, 11), message_id: 'MSG-B13', link_to_source: '#' },
    blockerDetails: { id: 'blocker-13', issue: 'Next.js build bundle exceeds Vercel warning limits', severity: 'Low', status: 'Resolved', provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(14, 11), message_id: 'MSG-B13', link_to_source: '#' } }
  },

  // METRICS (8 more)
  {
    id: 'metric-6',
    type: 'Metric',
    title: 'Weekly active workspace connections rose to 180',
    content: 'Total connected active workspaces has grown by 15% this week, showing healthy tool adoption among active founders.',
    timestamp: daysAgo(1, 10),
    provenance: { source: 'Stripe', author: 'Ingest System', timestamp: daysAgo(1, 10), message_id: 'MSG-M6', link_to_source: '#' },
    metricDetails: { id: 'metric-6', name: 'Active Workspace Connections', old_value: 156, new_value: 180, change: '+15.3%', provenance: { source: 'Stripe', author: 'Ingest System', timestamp: daysAgo(1, 10), message_id: 'MSG-M6', link_to_source: '#' } }
  },
  {
    id: 'metric-7',
    type: 'Metric',
    title: 'Average memory ingestion latency dropped to 420ms',
    content: 'Optimization work on the Postgres vectors indexing queries successfully shaved 180ms off average sync pipelines.',
    timestamp: daysAgo(3, 9),
    provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(3, 9), message_id: 'MSG-M7', link_to_source: '#' },
    metricDetails: { id: 'metric-7', name: 'Memory Extraction Ingestion Latency', old_value: '600ms', new_value: '420ms', change: '-30%', provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(3, 9), message_id: 'MSG-M7', link_to_source: '#' } }
  },
  {
    id: 'metric-8',
    type: 'Metric',
    title: 'Monthly Stripe billing failures increased to 3.2%',
    content: 'Failed card payment transactions increased due to international billing verification checks triggered by banks.',
    timestamp: daysAgo(5, 11),
    provenance: { source: 'Stripe', author: 'Stripe Billing System', timestamp: daysAgo(5, 11), message_id: 'MSG-M8', link_to_source: '#' },
    metricDetails: { id: 'metric-8', name: 'Failed Subscription Card Payments', old_value: '1.5%', new_value: '3.2%', change: '+113%', provenance: { source: 'Stripe', author: 'Stripe Billing System', timestamp: daysAgo(5, 11), message_id: 'MSG-M8', link_to_source: '#' } }
  },
  {
    id: 'metric-9',
    type: 'Metric',
    title: 'NPS Beta Customer Feedback Score recovered to 4.5',
    content: 'NPS rating recovered after fixing the App Store rejections and rolling out mobile apps to our early cohort group.',
    timestamp: daysAgo(2, 16),
    provenance: { source: 'Notion', author: 'Sarah Jenkins', timestamp: daysAgo(2, 16), message_id: 'MSG-M9', link_to_source: '#' },
    metricDetails: { id: 'metric-9', name: 'NPS Beta Customer Feedback Score', old_value: 4.1, new_value: 4.5, change: '+9.7%', provenance: { source: 'Notion', author: 'Sarah Jenkins', timestamp: daysAgo(2, 16), message_id: 'MSG-M9', link_to_source: '#' } }
  },
  {
    id: 'metric-10',
    type: 'Metric',
    title: 'Customer acquisition cost (CAC) dropped to $110',
    content: 'Content marketing referrals and Word-of-mouth recommendations drove paid CAC down, improving unit economics.',
    timestamp: daysAgo(8, 9),
    provenance: { source: 'Stripe', author: 'Marketing Sync', timestamp: daysAgo(8, 9), message_id: 'MSG-M10', link_to_source: '#' },
    metricDetails: { id: 'metric-10', name: 'Customer Acquisition Cost (CAC)', old_value: 145, new_value: 110, change: '-24.1%', provenance: { source: 'Stripe', author: 'Marketing Sync', timestamp: daysAgo(8, 9), message_id: 'MSG-M10', link_to_source: '#' } }
  },
  {
    id: 'metric-11',
    type: 'Metric',
    title: 'GitHub actions monthly compute billing hit $850',
    content: 'Compute costs dropped from $1,200 post AWS-migration, illustrating cost reductions of self-hosted runner infrastructure.',
    timestamp: daysAgo(10, 10),
    provenance: { source: 'Stripe', author: 'Finance Daemon', timestamp: daysAgo(10, 10), message_id: 'MSG-M11', link_to_source: '#' },
    metricDetails: { id: 'metric-11', name: 'Monthly Dev Build Infrastructure Cost', old_value: 1200, new_value: 850, change: '-29.1%', provenance: { source: 'Stripe', author: 'Finance Daemon', timestamp: daysAgo(10, 10), message_id: 'MSG-M11', link_to_source: '#' } }
  },
  {
    id: 'metric-12',
    type: 'Metric',
    title: 'Trial-to-Paid user conversion rate reached 32%',
    content: 'Changes in initial sandbox tutorials and onboarding setup guides boosted subscription rates.',
    timestamp: daysAgo(11, 9),
    provenance: { source: 'Stripe', author: 'Stripe System', timestamp: daysAgo(11, 9), message_id: 'MSG-M12', link_to_source: '#' },
    metricDetails: { id: 'metric-12', name: 'Trial-to-Paid Subscription Conversion', old_value: '22%', new_value: '32%', change: '+45.4%', provenance: { source: 'Stripe', author: 'Stripe System', timestamp: daysAgo(11, 9), message_id: 'MSG-M12', link_to_source: '#' } }
  },
  {
    id: 'metric-13',
    type: 'Metric',
    title: 'Customer Churn Rate decreased to 1.8%',
    content: 'Weekly customer feedback syncs indicate churn rate dropped to 1.8% after releasing raw CSV/JSON exporters.',
    timestamp: daysAgo(6, 10),
    provenance: { source: 'Stripe', author: 'Stripe Ingest', timestamp: daysAgo(6, 10), message_id: 'MSG-M13', link_to_source: '#' },
    metricDetails: { id: 'metric-13', name: 'Monthly Customer Churn Rate', old_value: '3.5%', new_value: '1.8%', change: '-48.5%', provenance: { source: 'Stripe', author: 'Stripe Ingest', timestamp: daysAgo(6, 10), message_id: 'MSG-M13', link_to_source: '#' } }
  },

  // DECISIONS (5 more)
  {
    id: 'decision-7',
    type: 'Decision',
    title: 'Deploy hourly sandbox resource cleanup cron task',
    content: 'We decided to automatically terminate idle TrustClaw execution containers after 45 minutes of user inactivity, curbing server utility bills.',
    timestamp: daysAgo(11, 14),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(11, 14), message_id: 'MSG-D7', link_to_source: '#' },
    decisionDetails: {
      id: 'decision-7',
      decision: 'Enforce 45-minute idle resource timeout for sandboxes',
      reason: 'Scaling monthly compute bills ($1,200) forced optimization of infrastructure idle resources.',
      date: '2026-06-03',
      blockerIds: [],
      metricIds: ['metric-11'],
      provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(11, 14), message_id: 'MSG-D7', link_to_source: '#' }
    }
  },
  {
    id: 'decision-8',
    type: 'Decision',
    title: 'Hire Senior Backend Infrastructure Engineer',
    content: 'Decided to extend a full-time engineering offer to Emily Vance to focus entirely on TrustClaw core scaling integrations.',
    timestamp: daysAgo(12, 15),
    provenance: { source: 'Notion', author: 'Sarah Jenkins', timestamp: daysAgo(12, 15), message_id: 'MSG-D8', link_to_source: '#' },
    decisionDetails: {
      id: 'decision-8',
      decision: 'Hire Emily Vance as Senior Backend Engineer',
      reason: 'Sustained user traffic growth (MAU reaching 4,200) causing scaling bottlenecks in real-time ingestion.',
      date: '2026-06-02',
      blockerIds: ['blocker-8'],
      metricIds: ['metric-3'],
      provenance: { source: 'Notion', author: 'Sarah Jenkins', timestamp: daysAgo(12, 15), message_id: 'MSG-D8', link_to_source: '#' }
    }
  },
  {
    id: 'decision-9',
    type: 'Decision',
    title: 'Postpone Slack app marketplace launch due to listing rejection',
    content: 'Decided to delay Slack app directory listing by two weeks, dedicating engineering hours to build a clear demo application environment.',
    timestamp: daysAgo(6, 14),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(6, 14), message_id: 'MSG-D9', link_to_source: '#' },
    decisionDetails: {
      id: 'decision-9',
      decision: 'Pause Slack app store listings review cycle',
      reason: 'Slack Directory team rejected the submission requesting video proof of sandboxing actions.',
      date: '2026-06-08',
      blockerIds: ['blocker-7'],
      metricIds: [],
      provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(6, 14), message_id: 'MSG-D9', link_to_source: '#' }
    }
  },
  {
    id: 'decision-10',
    type: 'Decision',
    title: 'Refactor database queries using multi-column indices',
    content: 'Approved a database schema update adding JSONB GIN indexes across historical message tables, resolving performance spikes.',
    timestamp: daysAgo(8, 15),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(8, 15), message_id: 'MSG-D10', link_to_source: '#' },
    decisionDetails: {
      id: 'decision-10',
      decision: 'Apply database index schemas in production',
      reason: 'Search latency spikes triggering high Postgres CPU rates (100% CPU load).',
      date: '2026-06-06',
      blockerIds: ['blocker-8'],
      metricIds: ['metric-7'],
      provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(8, 15), message_id: 'MSG-D10', link_to_source: '#' }
    }
  },
  {
    id: 'decision-11',
    type: 'Decision',
    title: 'Introduce 14-day free trial on onboarding flows',
    content: 'Approved launching a self-serve trial tier instead of upfront CC authorizations to lower conversion friction.',
    timestamp: daysAgo(11, 14),
    provenance: { source: 'Notion', author: 'Sarah Jenkins', timestamp: daysAgo(11, 14), message_id: 'MSG-D11', link_to_source: '#' },
    decisionDetails: {
      id: 'decision-11',
      decision: 'Roll out 14-day free trial tier',
      reason: 'High user friction during checkout, driving a desire to boost trial-to-paid conversion above 22%.',
      date: '2026-06-03',
      blockerIds: [],
      metricIds: ['metric-12'],
      provenance: { source: 'Notion', author: 'Sarah Jenkins', timestamp: daysAgo(11, 14), message_id: 'MSG-D11', link_to_source: '#' }
    }
  },

  // COMMITMENTS (8 more)
  {
    id: 'commitment-8',
    type: 'Commitment',
    title: 'Write automated sandbox container cleanup job script',
    content: 'Write the Node script querying active sessions and launching docker-compose teardown webhooks.',
    timestamp: daysAgo(11, 16),
    provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(11, 16), message_id: 'MSG-C8', link_to_source: '#' },
    commitmentDetails: { id: 'commitment-8', owner: 'Alex Rivera', task: 'Implement idle docker cleanup hook', deadline: daysAgo(9, 12), status: 'Fulfilled', decisionId: 'decision-7', provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(11, 16), message_id: 'MSG-C8', link_to_source: '#' } }
  },
  {
    id: 'commitment-9',
    type: 'Commitment',
    title: 'Send formal employment offer letter to Emily Vance',
    content: 'Draft and email employment details, base salary parameters, and stock options agreements.',
    timestamp: daysAgo(12, 16),
    provenance: { source: 'Gmail', author: 'Sarah Jenkins', timestamp: daysAgo(12, 16), message_id: 'MSG-C9', link_to_source: '#' },
    commitmentDetails: { id: 'commitment-9', owner: 'Sarah Jenkins', task: 'Send offer letter and equity paperwork to Emily', deadline: daysAgo(11, 17), status: 'Fulfilled', decisionId: 'decision-8', provenance: { source: 'Gmail', author: 'Sarah Jenkins', timestamp: daysAgo(12, 16), message_id: 'MSG-C9', link_to_source: '#' } }
  },
  {
    id: 'commitment-10',
    type: 'Commitment',
    title: 'Record Slack authorization flow demonstration video',
    content: 'Capture dynamic sandbox interactions in screen recording, highlighting local encryption boundaries.',
    timestamp: daysAgo(5, 16),
    provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(5, 16), message_id: 'MSG-C10', link_to_source: '#' },
    commitmentDetails: { id: 'commitment-10', owner: 'Marcus Chen', task: 'Record listing sandbox explanation demo clip', deadline: daysAgo(4, 18), status: 'Fulfilled', decisionId: 'decision-9', provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(5, 16), message_id: 'MSG-C10', link_to_source: '#' } }
  },
  {
    id: 'commitment-11',
    type: 'Commitment',
    title: 'Resubmit Slack listing review application in portal',
    content: 'Submit finalized screen recording link alongside revised description text to listing reviewer.',
    timestamp: daysAgo(4, 11),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(4, 11), message_id: 'MSG-C11', link_to_source: '#' },
    commitmentDetails: { id: 'commitment-11', owner: 'Sarah Jenkins', task: 'Resubmit Slack Listing Application metadata', deadline: daysAgo(3, 17), status: 'Fulfilled', decisionId: 'decision-9', provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(4, 11), message_id: 'MSG-C11', link_to_source: '#' } }
  },
  {
    id: 'commitment-12',
    type: 'Commitment',
    title: 'Write SQL migration script adding indices to JSON fields',
    content: 'Draft migration migration files adding GIN indices over memory metadata structures.',
    timestamp: daysAgo(8, 16),
    provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(8, 16), message_id: 'MSG-C12', link_to_source: '#' },
    commitmentDetails: { id: 'commitment-12', owner: 'Alex Rivera', task: 'Write and test SQL indexing migration logic', deadline: daysAgo(7, 12), status: 'Fulfilled', decisionId: 'decision-10', provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(8, 16), message_id: 'MSG-C12', link_to_source: '#' } }
  },
  {
    id: 'commitment-13',
    type: 'Commitment',
    title: 'Refactor pricing billing page layout on landing site',
    content: 'Draft marketing layout explaining the 14-day trial offer structures and custom enterprise options.',
    timestamp: daysAgo(11, 15),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(11, 15), message_id: 'MSG-C13', link_to_source: '#' },
    commitmentDetails: { id: 'commitment-13', owner: 'Sarah Jenkins', task: 'Implement pricing marketing page updates', deadline: daysAgo(9, 18), status: 'Fulfilled', decisionId: 'decision-11', provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(11, 15), message_id: 'MSG-C13', link_to_source: '#' } }
  },
  {
    id: 'commitment-14',
    type: 'Commitment',
    title: 'Review Composio connection retry failure configurations',
    content: 'Review error catching block within Composio client wrapper to verify if tokens are re-requested.',
    timestamp: daysAgo(1, 15),
    provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(1, 15), message_id: 'MSG-C14', link_to_source: '#' },
    commitmentDetails: { id: 'commitment-14', owner: 'Alex Rivera', task: 'Review token auto-refresh catch blocks in service', deadline: daysAgo(-1, 18), status: 'Open', provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(1, 15), message_id: 'MSG-C14', link_to_source: '#' } }
  },
  {
    id: 'commitment-15',
    type: 'Commitment',
    title: 'Schedule post-mortem briefing call with AWS solutions engineer',
    content: 'Book a call to review VPC configs to see why custom subdomain SSLs timed out during renewals.',
    timestamp: daysAgo(9, 11),
    provenance: { source: 'Calendar', author: 'Marcus Chen', timestamp: daysAgo(9, 11), message_id: 'MSG-C15', link_to_source: '#' },
    commitmentDetails: { id: 'commitment-15', owner: 'Marcus Chen', task: 'Schedule AWS support consultation', deadline: daysAgo(8, 12), status: 'Fulfilled', provenance: { source: 'Calendar', author: 'Marcus Chen', timestamp: daysAgo(9, 11), message_id: 'MSG-C15', link_to_source: '#' } }
  },

  // 17 ADDITIONAL STANDALONE MEMORIES TO COMPLETE 55+ RECORD REQUIREMENT
  // Gmails / Slacks representing general startup operations
  {
    id: 'mem-16',
    type: 'Commitment',
    title: 'Draft investor quarterly newsletter draft in shared Google Doc',
    content: 'Founders must draft updates on MRR, user traction, and the AWS runner migration.',
    timestamp: daysAgo(1, 14),
    provenance: { source: 'Gmail', author: 'Markus (Ardent)', timestamp: daysAgo(1, 14), message_id: 'M16', link_to_source: '#' },
    commitmentDetails: { id: 'mem-16', owner: 'Sarah Jenkins', task: 'Draft quarterly board deck outline', deadline: daysAgo(-2, 17), status: 'Open', provenance: { source: 'Gmail', author: 'Markus (Ardent)', timestamp: daysAgo(1, 14), message_id: 'M16', link_to_source: '#' } }
  },
  {
    id: 'mem-17',
    type: 'Decision',
    title: 'De-prioritize direct database sync in favor of TrustClaw pipelines',
    content: 'Sarah: We decided to use TrustClaw\'s long-term memory layer exclusively rather than writing a raw Postgres database adapter for tool integrations.',
    timestamp: daysAgo(14, 16),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(14, 16), message_id: 'M17', link_to_source: '#' },
    decisionDetails: { id: 'mem-17', decision: 'Rely exclusively on TrustClaw memory storage', reason: 'Save hours of OAuth boilerplates and postgres setup during staging trial phase.', date: '2026-05-31', blockerIds: [], metricIds: [], provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(14, 16), message_id: 'M17', link_to_source: '#' } }
  },
  {
    id: 'mem-18',
    type: 'Blocker',
    title: 'Legal reviews of SOC2 compliance vendor options delayed',
    content: 'Our legal counsel has not approved the contracts for the compliance auditor, slowing down our enterprise onboarding schedule.',
    timestamp: daysAgo(2, 9),
    provenance: { source: 'Gmail', author: 'Legal Counsel', timestamp: daysAgo(2, 9), message_id: 'M18', link_to_source: '#' },
    blockerDetails: { id: 'mem-18', issue: 'SOC2 vendor audit agreement stuck in legal review', severity: 'Medium', status: 'Open', provenance: { source: 'Gmail', author: 'Legal Counsel', timestamp: daysAgo(2, 9), message_id: 'M18', link_to_source: '#' } }
  },
  {
    id: 'mem-19',
    type: 'Metric',
    title: 'Customer support average response times decreased to 1.2 hours',
    content: 'Automation templates on common setup issues successfully decreased support response times.',
    timestamp: daysAgo(4, 11),
    provenance: { source: 'Notion', author: 'Support Ops', timestamp: daysAgo(4, 11), message_id: 'M19', link_to_source: '#' },
    metricDetails: { id: 'mem-19', name: 'Average Support Response Time', old_value: '2.5h', new_value: '1.2h', change: '-52%', provenance: { source: 'Notion', author: 'Support Ops', timestamp: daysAgo(4, 11), message_id: 'M19', link_to_source: '#' } }
  },
  {
    id: 'mem-20',
    type: 'Commitment',
    title: 'Call SOC2 compliance vendor auditor to accelerate review',
    content: 'Call Vanta accounts executive to clarify staging options and check if audit templates are available.',
    timestamp: daysAgo(2, 10),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(2, 10), message_id: 'M20', link_to_source: '#' },
    commitmentDetails: { id: 'mem-20', owner: 'Sarah Jenkins', task: 'Follow up with Vanta SOC2 sales lead', deadline: daysAgo(1, 18), status: 'Fulfilled', provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(2, 10), message_id: 'M20', link_to_source: '#' } }
  },
  {
    id: 'mem-21',
    type: 'Decision',
    title: 'De-prioritize self-hosted landing page in favor of Vercel platform',
    content: 'Decided to deploy marketing site direct to Vercel instead of AWS S3 static configurations to save hosting costs.',
    timestamp: daysAgo(15, 10),
    provenance: { source: 'Notion', author: 'Sarah Jenkins', timestamp: daysAgo(15, 10), message_id: 'M21', link_to_source: '#' },
    decisionDetails: { id: 'mem-21', decision: 'Deploy marketing layout on Vercel', reason: 'Vercel CDN capabilities and previews reduce dev friction.', date: '2026-05-30', blockerIds: [], metricIds: [], provenance: { source: 'Notion', author: 'Sarah Jenkins', timestamp: daysAgo(15, 10), message_id: 'M21', link_to_source: '#' } }
  },
  {
    id: 'mem-22',
    type: 'Blocker',
    title: 'Marketing social campaign designs delayed by contractor review',
    content: 'Contract design agency has not delivered initial vector assets for landing page announcement grids.',
    timestamp: daysAgo(5, 14),
    provenance: { source: 'Gmail', author: 'Sarah Jenkins', timestamp: daysAgo(5, 14), message_id: 'M22', link_to_source: '#' },
    blockerDetails: { id: 'mem-22', issue: 'Contract design asset delivery is delayed', severity: 'Low', status: 'Resolved', provenance: { source: 'Gmail', author: 'Sarah Jenkins', timestamp: daysAgo(5, 14), message_id: 'M22', link_to_source: '#' } }
  },
  {
    id: 'mem-23',
    type: 'Metric',
    title: 'Landing page bounce rate decreased to 38%',
    content: 'Vercel optimization and asset compressing successfully boosted load times, dropping bounce rate from 52%.',
    timestamp: daysAgo(12, 10),
    provenance: { source: 'Notion', author: 'Marketing System', timestamp: daysAgo(12, 10), message_id: 'M23', link_to_source: '#' },
    metricDetails: { id: 'mem-23', name: 'Marketing Website Bounce Rate', old_value: '52%', new_value: '38%', change: '-26.9%', provenance: { source: 'Notion', author: 'Marketing System', timestamp: daysAgo(12, 10), message_id: 'M23', link_to_source: '#' } }
  },
  {
    id: 'mem-24',
    type: 'Commitment',
    title: 'Review landing page bounce analytics reports on Posthog dashboard',
    content: 'Sarah: Verify that compressed assets and lazy loading are working fine across mobile Safari environments.',
    timestamp: daysAgo(11, 9),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(11, 9), message_id: 'M24', link_to_source: '#' },
    commitmentDetails: { id: 'mem-24', owner: 'Sarah Jenkins', task: 'Check Safari mobile loading optimization', deadline: daysAgo(10, 18), status: 'Fulfilled', provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(11, 9), message_id: 'M24', link_to_source: '#' } }
  },
  {
    id: 'mem-25',
    type: 'Decision',
    title: 'Approve hiring external contract writer for startup compliance documentation',
    content: 'Sarah: We decided to hire a technical copywriter to complete Vanta SOC2 policy manuals.',
    timestamp: daysAgo(1, 16),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(1, 16), message_id: 'M25', link_to_source: '#' },
    decisionDetails: { id: 'mem-25', decision: 'Hire compliance copywriter', reason: 'Avoid taking up engineering hours for drafting standard workspace safety guidelines.', date: '2026-06-13', blockerIds: ['mem-18'], metricIds: [], provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(1, 16), message_id: 'M25', link_to_source: '#' } }
  },
  {
    id: 'mem-26',
    type: 'Commitment',
    title: 'Draft contract brief for technical copywriter onboarding on Upwork',
    content: 'Post standard job outline specifying SOC2 compliance policies documentation guidelines.',
    timestamp: daysAgo(1, 17),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(1, 17), message_id: 'M26', link_to_source: '#' },
    commitmentDetails: { id: 'mem-26', owner: 'Sarah Jenkins', task: 'Post compliance writer contract listing', deadline: daysAgo(-1, 12), status: 'Open', decisionId: 'mem-25', provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(1, 17), message_id: 'M26', link_to_source: '#' } }
  },
  {
    id: 'mem-27',
    type: 'Blocker',
    title: 'Slack token refresh endpoints throwing intermittent 500 errors',
    content: 'We noticed refresh failures occurring on specific Slack channels during automated briefs, returning token invalid error structures.',
    timestamp: daysAgo(4, 9),
    provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(4, 9), message_id: 'M27', link_to_source: '#' },
    blockerDetails: { id: 'mem-27', issue: 'Slack sync wrapper intermittent API errors', severity: 'High', status: 'Resolved', provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(4, 9), message_id: 'M27', link_to_source: '#' } }
  },
  {
    id: 'mem-28',
    type: 'Metric',
    title: 'Weekly onboarding waitlist count increased to 110',
    content: 'Viral post on product marketing drove waitlist growth, adding urgency to sandboxing automation plans.',
    timestamp: daysAgo(3, 10),
    provenance: { source: 'Notion', author: 'Sarah Jenkins', timestamp: daysAgo(3, 10), message_id: 'M28', link_to_source: '#' },
    metricDetails: { id: 'mem-28', name: 'Beta Launch Waitlist Size', old_value: 65, new_value: 110, change: '+69.2%', provenance: { source: 'Notion', author: 'Sarah Jenkins', timestamp: daysAgo(3, 10), message_id: 'M28', link_to_source: '#' } }
  },
  {
    id: 'mem-29',
    type: 'Commitment',
    title: 'Deploy waitlist feedback forms for onboarding user segment analysis',
    content: 'Send automated email questions inquiring waitlist signups about their stack configurations.',
    timestamp: daysAgo(2, 9),
    provenance: { source: 'Gmail', author: 'Sarah Jenkins', timestamp: daysAgo(2, 9), message_id: 'M29', link_to_source: '#' },
    commitmentDetails: { id: 'mem-29', owner: 'Sarah Jenkins', task: 'Deploy Typeform survey to waitlist users', deadline: daysAgo(1, 18), status: 'Fulfilled', provenance: { source: 'Gmail', author: 'Sarah Jenkins', timestamp: daysAgo(2, 9), message_id: 'M29', link_to_source: '#' } }
  },
  {
    id: 'mem-30',
    type: 'Decision',
    title: 'Approve using Typeform surveys for waitlist customer discovery',
    content: 'Sarah: We decided to deploy Typeform triggers to filter waitlist applicants based on their workspace tool integrations.',
    timestamp: daysAgo(3, 15),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(3, 15), message_id: 'M30', link_to_source: '#' },
    decisionDetails: { id: 'mem-30', decision: 'Launch waitlist tool surveys', reason: 'Better allocate initial onboarding sandbox resources to high-value tool stacks.', date: '2026-06-11', blockerIds: [], metricIds: ['mem-28'], provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(3, 15), message_id: 'M30', link_to_source: '#' } }
  },
  // STANDALONE / HISTORY (mem-31 to mem-50)
  {
    id: 'mem-31',
    type: 'Metric',
    title: 'Monthly linear ticket resolution rate hit 88%',
    content: 'Developer workflow adjustments and AWS EC2 runner speed improvements boosted overall ticket resolution rates.',
    timestamp: daysAgo(8, 10),
    provenance: { source: 'Linear', author: 'System Stats', timestamp: daysAgo(8, 10), message_id: 'M31', link_to_source: '#' },
    metricDetails: { id: 'mem-31', name: 'Engineering Sprint Ticket Resolution', old_value: '72%', new_value: '88%', change: '+22.2%', provenance: { source: 'Linear', author: 'System Stats', timestamp: daysAgo(8, 10), message_id: 'M31', link_to_source: '#' } }
  },
  {
    id: 'mem-32',
    type: 'Blocker',
    title: 'Weekly compliance scans throwing false-positive Trojan warnings',
    content: 'Static analysis scanners flagged sandboxed execution test modules as dangerous, triggering false build warnings.',
    timestamp: daysAgo(12, 8),
    provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(12, 8), message_id: 'M32', link_to_source: '#' },
    blockerDetails: { id: 'mem-32', issue: 'Compliance security scanner false Trojan flags', severity: 'Low', status: 'Resolved', provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(12, 8), message_id: 'M32', link_to_source: '#' } }
  },
  {
    id: 'mem-33',
    type: 'Commitment',
    title: 'Configure Snyk security scanner exclusions wrapper files',
    content: 'Review and merge scanner exclusion lists to bypass testing folders for sandbox run binaries.',
    timestamp: daysAgo(12, 9),
    provenance: { source: 'Linear', author: 'Marcus Chen', timestamp: daysAgo(12, 9), message_id: 'M33', link_to_source: '#' },
    commitmentDetails: { id: 'mem-33', owner: 'Marcus Chen', task: 'Add Snyk compliance folder exclusions rules', deadline: daysAgo(10, 18), status: 'Fulfilled', provenance: { source: 'Linear', author: 'Marcus Chen', timestamp: daysAgo(12, 9), message_id: 'M33', link_to_source: '#' } }
  },
  {
    id: 'mem-34',
    type: 'Decision',
    title: 'Approve Vanta as official SOC2 compliance software partner',
    content: 'Sarah: Agreed to purchase Vanta automation suite after comparing proposals and legal reviews.',
    timestamp: daysAgo(1, 16),
    provenance: { source: 'Notion', author: 'Sarah Jenkins', timestamp: daysAgo(1, 16), message_id: 'M34', link_to_source: '#' },
    decisionDetails: { id: 'mem-34', decision: 'Purchase Vanta Compliance platform subscription', reason: 'Vanta integrations with AWS and GitHub automate 90% of evidence checks.', date: '2026-06-13', blockerIds: ['mem-18'], metricIds: [], provenance: { source: 'Notion', author: 'Sarah Jenkins', timestamp: daysAgo(1, 16), message_id: 'M34', link_to_source: '#' } }
  },
  {
    id: 'mem-35',
    type: 'Commitment',
    title: 'Wire Vanta integration scopes into corporate AWS console',
    content: 'Enable Vanta IAM auditor role to pull metadata records regarding cloud infrastructure configurations.',
    timestamp: daysAgo(0, 10),
    provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(0, 10), message_id: 'M35', link_to_source: '#' },
    commitmentDetails: { id: 'mem-35', owner: 'Marcus Chen', task: 'Provision AWS IAM role read-only credentials for Vanta integration', deadline: daysAgo(-1, 18), status: 'Open', decisionId: 'mem-34', provenance: { source: 'Slack', author: 'Marcus Chen', timestamp: daysAgo(0, 10), message_id: 'M35', link_to_source: '#' } }
  },
  {
    id: 'mem-36',
    type: 'Metric',
    title: 'Weekly demo booking conversions rose to 18%',
    content: 'A customer referral campaign boosted book demo page conversion metrics this week.',
    timestamp: daysAgo(5, 10),
    provenance: { source: 'Stripe', author: 'Ingest Systems', timestamp: daysAgo(5, 10), message_id: 'M36', link_to_source: '#' },
    metricDetails: { id: 'mem-36', name: 'Demo Booking Conversion Rate', old_value: '14%', new_value: '18%', change: '+28.5%', provenance: { source: 'Stripe', author: 'Ingest Systems', timestamp: daysAgo(5, 10), message_id: 'M36', link_to_source: '#' } }
  },
  {
    id: 'mem-37',
    type: 'Blocker',
    title: 'Stripe webhook processing retries piling up on backend server',
    content: 'Intermittent database lock conditions on pilot client updates are forcing Stripe to retry subscription events.',
    timestamp: daysAgo(2, 8),
    provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(2, 8), message_id: 'M37', link_to_source: '#' },
    blockerDetails: { id: 'mem-37', issue: 'Stripe webhook retry pile-ups causing billing delay risks', severity: 'High', status: 'Resolved', provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(2, 8), message_id: 'M37', link_to_source: '#' } }
  },
  {
    id: 'mem-38',
    type: 'Commitment',
    title: 'Apply database connection pool scaling configuration tweaks',
    content: 'Configure Prisma connection pool sizes to prevent webhook transactions from blocking core reads.',
    timestamp: daysAgo(2, 9),
    provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(2, 9), message_id: 'M38', link_to_source: '#' },
    commitmentDetails: { id: 'mem-38', owner: 'Alex Rivera', task: 'Optimize Prisma db pool size limits', deadline: daysAgo(1, 12), status: 'Fulfilled', provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(2, 9), message_id: 'M38', link_to_source: '#' } }
  },
  {
    id: 'mem-39',
    type: 'Decision',
    title: 'Scale Prisma DB pool limit size configurations in server envs',
    content: 'Sarah: Approved scale update to fix billing webhook timeout errors.',
    timestamp: daysAgo(2, 12),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(2, 12), message_id: 'M39', link_to_source: '#' },
    decisionDetails: { id: 'mem-39', decision: 'Prisma DB connection pool limit expansion configuration', reason: 'Billing webhook delivery failures under database locking conditions.', date: '2026-06-12', blockerIds: ['mem-37'], metricIds: [], provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(2, 12), message_id: 'M39', link_to_source: '#' } }
  },
  {
    id: 'mem-40',
    type: 'Metric',
    title: 'Stripe checkout checkout success rates hit 99.4%',
    content: 'Prisma connection pool tweaks successfully resolved webhook drops, recovering checkouts error rates.',
    timestamp: daysAgo(1, 10),
    provenance: { source: 'Stripe', author: 'Finance Systems', timestamp: daysAgo(1, 10), message_id: 'M40', link_to_source: '#' },
    metricDetails: { id: 'mem-40', name: 'Subscription checkout success rates', old_value: '95.2%', new_value: '99.4%', change: '+4.4%', provenance: { source: 'Stripe', author: 'Finance Systems', timestamp: daysAgo(1, 10), message_id: 'M40', link_to_source: '#' } }
  },
  // STANDALONE / DETAILS - 10 more to guarantee the count is at least 50.
  {
    id: 'mem-41',
    type: 'Blocker',
    title: 'Customer reporting team claims MRR calculation mismatches',
    content: 'A customer reporting audit flagged that Stripe refunds are not correctly deducted from Posthog analytic cards.',
    timestamp: daysAgo(7, 9),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(7, 9), message_id: 'M41', link_to_source: '#' },
    blockerDetails: { id: 'mem-41', issue: 'Posthog analytics dashboards showing MRR calculation mismatches', severity: 'Medium', status: 'Resolved', provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(7, 9), message_id: 'M41', link_to_source: '#' } }
  },
  {
    id: 'mem-42',
    type: 'Metric',
    title: 'Average query response time decreased from 1.5s to 0.4s',
    content: 'Semantic database optimizations and index structures dramatically improved AI retrieval performance.',
    timestamp: daysAgo(8, 10),
    provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(8, 10), message_id: 'M42', link_to_source: '#' },
    metricDetails: { id: 'mem-42', name: 'AI Reasoning Retrieval Latency', old_value: '1.5s', new_value: '0.4s', change: '-73.3%', provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(8, 10), message_id: 'M42', link_to_source: '#' } }
  },
  {
    id: 'mem-43',
    type: 'Decision',
    title: 'Adopt vector-based semantic search caching system for QA',
    content: 'Sarah: Approved setting up Redis cache layers for recurring AI memory extraction prompts, saving tokens.',
    timestamp: daysAgo(9, 15),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(9, 15), message_id: 'M43', link_to_source: '#' },
    decisionDetails: { id: 'mem-43', decision: 'Apply Redis caches for AI extraction query caching', reason: 'High API model costs and slow response times (1.5s queries).', date: '2026-06-05', blockerIds: [], metricIds: ['mem-42'], provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(9, 15), message_id: 'M43', link_to_source: '#' } }
  },
  {
    id: 'mem-44',
    type: 'Commitment',
    title: 'Provision Redis cache server node inside workspace AWS VPC',
    content: 'Marcus: Set up standard container resources inside Terraform files and deploy configuration.',
    timestamp: daysAgo(9, 16),
    provenance: { source: 'Linear', author: 'Marcus Chen', timestamp: daysAgo(9, 16), message_id: 'M44', link_to_source: '#' },
    commitmentDetails: { id: 'mem-44', owner: 'Marcus Chen', task: 'Deploy AWS Redis cluster resources', deadline: daysAgo(8, 12), status: 'Fulfilled', decisionId: 'mem-43', provenance: { source: 'Linear', author: 'Marcus Chen', timestamp: daysAgo(9, 16), message_id: 'M44', link_to_source: '#' } }
  },
  {
    id: 'mem-45',
    type: 'Commitment',
    title: 'Configure redis connection parameters inside service wrapper',
    content: 'Alex: Integrate ioredis package scripts inside query extraction pipeline models.',
    timestamp: daysAgo(9, 17),
    provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(9, 17), message_id: 'M45', link_to_source: '#' },
    commitmentDetails: { id: 'mem-45', owner: 'Alex Rivera', task: 'Implement Redis caching loops inside core pipeline code', deadline: daysAgo(7, 18), status: 'Fulfilled', decisionId: 'mem-43', provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(9, 17), message_id: 'M45', link_to_source: '#' } }
  },
  {
    id: 'mem-46',
    type: 'Blocker',
    title: 'Linear tool integration mapping status fields incorrectly',
    content: 'Extracted task cards are marking custom stages as backlog instead of in-progress, throwing analytics trends off.',
    timestamp: daysAgo(10, 9),
    provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(10, 9), message_id: 'M46', link_to_source: '#' },
    blockerDetails: { id: 'mem-46', issue: 'Linear custom status parsing issue in ingestion parser', severity: 'Low', status: 'Resolved', provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(10, 9), message_id: 'M46', link_to_source: '#' } }
  },
  {
    id: 'mem-47',
    type: 'Commitment',
    title: 'Deploy Linear API mapper status adjustments fix patch',
    content: 'Alex: Review Linear status code map arrays to include our custom corporate categories.',
    timestamp: daysAgo(10, 11),
    provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(10, 11), message_id: 'M47', link_to_source: '#' },
    commitmentDetails: { id: 'mem-47', owner: 'Alex Rivera', task: 'Push bugfix for Linear workspace task status mapping', deadline: daysAgo(9, 18), status: 'Fulfilled', provenance: { source: 'Linear', author: 'Alex Rivera', timestamp: daysAgo(10, 11), message_id: 'M47', link_to_source: '#' } }
  },
  {
    id: 'mem-48',
    type: 'Metric',
    title: 'Corporate onboarding wait time dropped to 10 minutes',
    content: 'Onboarding sandboxing automation reduced initial workspace setup waiting times dramatically from 48h.',
    timestamp: daysAgo(0, 12),
    provenance: { source: 'Notion', author: 'Ingest System', timestamp: daysAgo(0, 12), message_id: 'M48', link_to_source: '#' },
    metricDetails: { id: 'mem-48', name: 'Average Onboarding Sandbox Provisioning Time', old_value: '48h', new_value: '10m', change: '-99.6%', provenance: { source: 'Notion', author: 'Ingest System', timestamp: daysAgo(0, 12), message_id: 'M48', link_to_source: '#' } }
  },
  {
    id: 'mem-49',
    type: 'Blocker',
    title: 'Investor reporting email sync errors on Gmail attachment limits',
    content: 'Board updates with large metrics logs PDFs fail to import because they exceed the 20MB extraction threshold in mail loops.',
    timestamp: daysAgo(1, 9),
    provenance: { source: 'Gmail', author: 'Sarah Jenkins', timestamp: daysAgo(1, 9), message_id: 'M49', link_to_source: '#' },
    blockerDetails: { id: 'mem-49', issue: 'Gmail sync crashes on attachments exceeding 20MB', severity: 'Low', status: 'Open', provenance: { source: 'Gmail', author: 'Sarah Jenkins', timestamp: daysAgo(1, 9), message_id: 'M49', link_to_source: '#' } }
  },
  {
    id: 'mem-50',
    type: 'Decision',
    title: 'Restrict automated memory processing indexer to text and tables',
    content: 'Sarah: Approved configuring ingestion pipeline to bypass binary downloads on Gmail, storing references only.',
    timestamp: daysAgo(1, 14),
    provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(1, 14), message_id: 'M50', link_to_source: '#' },
    decisionDetails: { id: 'mem-50', decision: 'Bypass mail attachments downloads during indexing cycles', reason: 'Email attachment limit errors causing memory ingestion to crash.', date: '2026-06-13', blockerIds: ['mem-49'], metricIds: [], provenance: { source: 'Slack', author: 'Sarah Jenkins', timestamp: daysAgo(1, 14), message_id: 'M50', link_to_source: '#' } }
  },
  {
    id: 'mem-51',
    type: 'Commitment',
    title: 'Edit Gmail attachments downloader logic in sync engine',
    content: 'Alex: Add files size and mime check functions inside email processor code.',
    timestamp: daysAgo(1, 15),
    provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(1, 15), message_id: 'M51', link_to_source: '#' },
    commitmentDetails: { id: 'mem-51', owner: 'Alex Rivera', task: 'Write mime and size check bypass logic for email attachments', deadline: daysAgo(0, 18), status: 'Open', decisionId: 'mem-50', provenance: { source: 'Slack', author: 'Alex Rivera', timestamp: daysAgo(1, 15), message_id: 'M51', link_to_source: '#' } }
  }
];
