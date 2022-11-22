import { PetitionStatus } from "@parallel/graphql/__types";

export function usePetitionStatusColor(status: PetitionStatus) {
  let color = "";

  switch (status) {
    case "DRAFT":
      color = "gray.500";
      break;
    case "PENDING":
      color = "yellow.600";
      break;
    case "COMPLETED":
    case "CLOSED":
      color = "green.500";
      break;
    default:
      color = "gray.800";
      break;
  }

  return color;
}
