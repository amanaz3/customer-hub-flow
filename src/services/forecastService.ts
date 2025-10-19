export interface ForecastData {
  currentPace: number; // applications per day
  daysRemaining: number;
  daysElapsed: number;
  projectedApplications: number;
  projectedCompleted: number;
  projectedRevenue: number;
  requiredPaceApplications: number;
  requiredPaceCompleted: number;
  requiredPaceRevenue: number;
  status: 'on-track' | 'at-risk' | 'off-track';
  insights: string[];
}

export const forecastService = {
  calculateForecast(
    currentApplications: number,
    currentCompleted: number,
    currentRevenue: number,
    targetApplications: number,
    targetCompleted: number,
    targetRevenue: number,
    currentDay: number,
    totalDaysInMonth: number
  ): ForecastData {
    const daysElapsed = currentDay;
    const daysRemaining = totalDaysInMonth - currentDay;

    // Calculate current pace (per day)
    const currentPace = daysElapsed > 0 ? currentApplications / daysElapsed : 0;
    const completedPace = daysElapsed > 0 ? currentCompleted / daysElapsed : 0;
    const revenuePace = daysElapsed > 0 ? currentRevenue / daysElapsed : 0;

    // Project end-of-month numbers
    const projectedApplications = Math.round(currentApplications + (currentPace * daysRemaining));
    const projectedCompleted = Math.round(currentCompleted + (completedPace * daysRemaining));
    const projectedRevenue = currentRevenue + (revenuePace * daysRemaining);

    // Calculate required pace to hit targets
    const remainingApplications = Math.max(0, targetApplications - currentApplications);
    const remainingCompleted = Math.max(0, targetCompleted - currentCompleted);
    const remainingRevenue = Math.max(0, targetRevenue - currentRevenue);

    const requiredPaceApplications = daysRemaining > 0 ? remainingApplications / daysRemaining : 0;
    const requiredPaceCompleted = daysRemaining > 0 ? remainingCompleted / daysRemaining : 0;
    const requiredPaceRevenue = daysRemaining > 0 ? remainingRevenue / daysRemaining : 0;

    // Determine status
    let status: 'on-track' | 'at-risk' | 'off-track';
    const progressPercent = targetApplications > 0 ? (currentApplications / targetApplications) * 100 : 0;
    const timePercent = (daysElapsed / totalDaysInMonth) * 100;

    if (progressPercent >= timePercent - 5) {
      status = 'on-track';
    } else if (progressPercent >= timePercent - 15) {
      status = 'at-risk';
    } else {
      status = 'off-track';
    }

    // Generate insights
    const insights: string[] = [];

    if (status === 'on-track') {
      insights.push(`Great work! You're ${(progressPercent - timePercent).toFixed(0)}% ahead of schedule.`);
    } else if (status === 'at-risk') {
      insights.push(`You're slightly behind. Need ${Math.ceil(requiredPaceApplications)} applications/day to hit target.`);
    } else {
      insights.push(`Urgent: ${Math.ceil(remainingApplications)} applications needed in ${daysRemaining} days.`);
    }

    if (projectedApplications < targetApplications) {
      const shortfall = targetApplications - projectedApplications;
      insights.push(`At current pace, you'll be ${shortfall} applications short.`);
    } else {
      insights.push(`On track to exceed target by ${projectedApplications - targetApplications} applications! 🎉`);
    }

    if (daysRemaining <= 7 && remainingCompleted > 0) {
      insights.push(`Only ${daysRemaining} days left - focus on completing ${remainingCompleted} applications.`);
    }

    return {
      currentPace,
      daysRemaining,
      daysElapsed,
      projectedApplications,
      projectedCompleted,
      projectedRevenue,
      requiredPaceApplications,
      requiredPaceCompleted,
      requiredPaceRevenue,
      status,
      insights,
    };
  },
};
