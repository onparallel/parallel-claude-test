import { Box } from "@chakra-ui/react";
import { DashboardNumberValue } from "./DashboardNumberValue";

export function DashboardRatio({
  value,
  total,
  isPercentage,
  isEditing,
}: {
  value: number;
  total: number;
  isPercentage: boolean;
  isEditing?: boolean;
}) {
  return isPercentage ? (
    <DashboardNumberValue value={value / total} isPercentage isEditing={isEditing} />
  ) : (
    <>
      <DashboardNumberValue value={value} isEditing={isEditing} />
      <Box lineHeight={1}>{"/"}</Box>
      <DashboardNumberValue value={total} isEditing={isEditing} />
    </>
  );
}
