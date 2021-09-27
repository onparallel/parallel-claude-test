import { CheckIcon, CloseIcon, TimeIcon } from "@parallel/chakra/icons";

export function PetitionSignatureRequestSignerStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "SIGNED":
      return <CheckIcon marginLeft={1} color="green.500" />;
    case "DECLINED":
      return <CloseIcon marginLeft={1} color="red.500" fontSize="12px" />;
    case "PENDING":
      return <TimeIcon marginLeft={1} color="yellow.600" />;
    default:
      return null;
  }
}
