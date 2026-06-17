const BASE_RATE = 0.15;
const HIGH_VOLUME_THRESHOLD = 5000;
const HIGH_VOLUME_RATE = 0.12;

export function calculateOrganizerPayout(grossRevenue) {
  if (grossRevenue <= HIGH_VOLUME_THRESHOLD) {
    const commission = grossRevenue * BASE_RATE;
    return {
      commissionAmount: commission,
      netPayout: grossRevenue - commission,
      commissionRate: BASE_RATE,
      breakdown: `15% commission on GHS ${grossRevenue.toFixed(2)}`,
    };
  }

  const baseCommission = HIGH_VOLUME_THRESHOLD * BASE_RATE;
  const excess = grossRevenue - HIGH_VOLUME_THRESHOLD;
  const excessCommission = excess * HIGH_VOLUME_RATE;
  const totalCommission = baseCommission + excessCommission;
  const effectiveRate = totalCommission / grossRevenue;

  return {
    commissionAmount: totalCommission,
    netPayout: grossRevenue - totalCommission,
    commissionRate: effectiveRate,
    breakdown: `15% on first GHS 5,000 + 12% on remaining GHS ${excess.toFixed(2)}`,
  };
}