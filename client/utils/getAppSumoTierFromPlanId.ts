export function getAppSumoTierFromPlanId(planId: string) {
  return {
    parallel_tier1: "AppSumo Tier 1",
    parallel_tier2: "AppSumo Tier 2",
    parallel_tier3: "AppSumo Tier 3",
    parallel_tier4: "AppSumo Tier 4",
  }[planId]!;
}
