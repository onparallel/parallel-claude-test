import {
  PetitionSignatureRequestStatus,
  PetitionSignatureStatusFilter,
} from "@parallel/graphql/__types";

export function mapSignatureRequestStatusToFilter(
  status: PetitionSignatureRequestStatus,
): PetitionSignatureStatusFilter {
  switch (status) {
    case "ENQUEUED":
      return "PENDING_START";
    case "PROCESSED":
      return "PROCESSING";
    case "CANCELLING":
      return "CANCELLED";
    default:
      return status as PetitionSignatureStatusFilter;
  }
}
