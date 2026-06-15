import { fetchMemories } from './_data';

export interface AnalyticsSummary {
  healthScore: number;
  blockerStats: { severity: string; count: number; color: string }[];
  completionStats: { owner: string; completed: number; pending: number; rate: number }[];
  decisionTrends: { date: string; count: number }[];
  categoryBreakdown: { category: string; count: number; max: number }[];
}

export const analyticsService = {
  getAnalyticsSummary: async (): Promise<AnalyticsSummary> => {
    const MOCK_MEMORIES = await fetchMemories();

    // 1. Dynamic Health Score Calculation
    // Base 100
    // Deduct 8 points for High-severity Open Blocker
    // Deduct 4 points for Medium-severity Open Blocker
    // Deduct 2 points for Low-severity Open Blocker
    // Deduct 5 points for Overdue Commitment
    let score = 100;
    const blockers = MOCK_MEMORIES.filter((m) => m.type === 'Blocker').map((m) => m.blockerDetails!);
    const commitments = MOCK_MEMORIES.filter((m) => m.type === 'Commitment').map((m) => m.commitmentDetails!);

    blockers.forEach((b) => {
      if (b.status === 'Open') {
        if (b.severity === 'High') score -= 8;
        else if (b.severity === 'Medium') score -= 4;
        else if (b.severity === 'Low') score -= 2;
      }
    });

    commitments.forEach((c) => {
      if (c.status === 'Overdue') {
        score -= 5;
      }
    });

    // Constrain health score to a valid 0-100 scale
    score = Math.max(0, Math.min(100, score));

    // 2. Blocker Stats
    const openBlockers = blockers.filter((b) => b.status === 'Open');
    const blockerSeverityCounts = { High: 0, Medium: 0, Low: 0 };
    openBlockers.forEach((b) => {
      blockerSeverityCounts[b.severity]++;
    });

    const blockerStats = [
      { severity: 'High', count: blockerSeverityCounts.High, color: '#f43f5e' }, // Rose
      { severity: 'Medium', count: blockerSeverityCounts.Medium, color: '#f59e0b' }, // Amber
      { severity: 'Low', count: blockerSeverityCounts.Low, color: '#3b82f6' } // Blue
    ];

    // 3. Completion Stats by Owner
    const completionByOwner: { [owner: string]: { completed: number; pending: number } } = {};
    commitments.forEach((c) => {
      const entry = completionByOwner[c.owner] ?? { completed: 0, pending: 0 };
      if (c.status === 'Fulfilled') {
        entry.completed++;
      } else {
        entry.pending++;
      }
      completionByOwner[c.owner] = entry;
    });

    const completionStats = Object.entries(completionByOwner).map(([owner, stats]) => {
      const total = stats.completed + stats.pending;
      const rate = total > 0 ? Math.round((stats.completed / total) * 100) : 100;
      return { owner, completed: stats.completed, pending: stats.pending, rate };
    });

    // 4. Decision Trends
    // Count decisions made on past dates
    const decisionDates: { [date: string]: number } = {};
    MOCK_MEMORIES.filter((m) => m.type === 'Decision').forEach((m) => {
      const dateStr = m.decisionDetails?.date || '2026-06-10';
      // Format as Jun 10 etc.
      const dateParts = dateStr.split('-');
      let formattedDate = dateStr;
      if (dateParts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = parseInt(dateParts[1] ?? '1', 10) - 1;
        formattedDate = `${months[mIdx] ?? ''} ${dateParts[2] ?? ''}`;
      }
      decisionDates[formattedDate] = (decisionDates[formattedDate] || 0) + 1;
    });

    // Sort dates logically
    const decisionTrends = Object.keys(decisionDates)
      .map((date) => ({ date, count: decisionDates[date] ?? 0 }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 5. Category Breakdown (mocking tool dependencies usage)
    const categoryBreakdown = [
      { category: 'Engineering Velocity', count: 18, max: 20 },
      { category: 'Financial Runway', count: 12, max: 20 },
      { category: 'Customer Churn Risks', count: 15, max: 20 },
      { category: 'Compliance Reviews', count: 8, max: 20 },
      { category: 'Product Strategy', count: 14, max: 20 }
    ];

    return {
      healthScore: score,
      blockerStats,
      completionStats,
      decisionTrends,
      categoryBreakdown
    };
  }
};
