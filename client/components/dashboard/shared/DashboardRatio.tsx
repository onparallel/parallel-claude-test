import { Box } from "@chakra-ui/react";
import { DashboardNumberValue } from "./DashboardNumberValue";

export function DashboardRatio({
  value,
  total,
  isPercentage,
}: {
  value: number;
  total: number;
  isPercentage: boolean;
}) {
  return isPercentage ? (
    <DashboardNumberValue value={value / total} isPercentage />
  ) : (
    <>
      <DashboardNumberValue value={value} />
      <Box lineHeight={1}>{"/"}</Box>
      <DashboardNumberValue value={total} />
    </>
  );
}
