import { fetchMemories } from './_data';
import { Commitment, MemoryItem } from '../types';

export interface DashboardSummary {
  kpis: {
    openCommitmentsCount: number;
    activeBlockersCount: number;
    recentDecisionsCount: number;
    mrrChange: {
      currentValue: string;
      changePercentage: string;
      isPositive: boolean;
    };
  };
  priorities: Commitment[];
  recentActivity: MemoryItem[];
  healthTrend: { date: string; score: number; commitments: number; blockers: number }[];
}

export const dashboardService = {
  getDashboardData: async (): Promise<DashboardSummary> => {
    const MOCK_MEMORIES = await fetchMemories();

    // 1. Calculate KPIs
    const openCommitments = MOCK_MEMORIES.filter(
      (m) => m.type === 'Commitment' && m.commitmentDetails?.status !== 'Fulfilled'
    );
    const activeBlockers = MOCK_MEMORIES.filter(
      (m) => m.type === 'Blocker' && m.blockerDetails?.status === 'Open'
    );
    const recentDecisions = MOCK_MEMORIES.filter(
      (m) => m.type === 'Decision' // Within simulated mock date ranges
    );

    // Grab latest MRR metric change
    const mrrMetric = MOCK_MEMORIES.find(
      (m) => m.type === 'Metric' && m.metricDetails?.name === 'Monthly Recurring Revenue (MRR)'
    );

    const mrrChange = {
      currentValue: mrrMetric ? `$${Number(mrrMetric.metricDetails?.new_value).toLocaleString()}` : '$10,500',
      changePercentage: mrrMetric ? mrrMetric.metricDetails?.change || '+25%' : '+25%',
      isPositive: true
    };

    // 2. Today's Priorities: Filter open commitments sorted by deadline (soonest first)
    const priorities = openCommitments
      .map((m) => m.commitmentDetails!)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);

    // 3. Recent Activity: Sort all memory items by timestamp descending
    const recentActivity = [...MOCK_MEMORIES]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);

    // 4. Generate historical operational health trends for dashboard charts
    // Score increases with resolved items and completed commitments; decreases with open blockers
    const healthTrend = [
      { date: 'Jun 05', score: 68, commitments: 8, blockers: 4 },
      { date: 'Jun 06', score: 70, commitments: 9, blockers: 4 },
      { date: 'Jun 07', score: 65, commitments: 11, blockers: 5 }, // App store rejection
      { date: 'Jun 08', score: 72, commitments: 8, blockers: 4 },
      { date: 'Jun 09', score: 74, commitments: 9, blockers: 3 },
      { date: 'Jun 10', score: 62, commitments: 12, blockers: 6 }, // Auth loop staging issue
      { date: 'Jun 11', score: 68, commitments: 10, blockers: 5 },
      { date: 'Jun 12', score: 78, commitments: 7, blockers: 4 },  // Stripe webhook resolved
      { date: 'Jun 13', score: 85, commitments: 5, blockers: 3 },
      { date: 'Jun 14', score: 89, commitments: 4, blockers: 3 }
    ];

    return {
      kpis: {
        openCommitmentsCount: openCommitments.length,
        activeBlockersCount: activeBlockers.length,
        recentDecisionsCount: recentDecisions.length,
        mrrChange
      },
      priorities,
      recentActivity,
      healthTrend
    };
  }
};
