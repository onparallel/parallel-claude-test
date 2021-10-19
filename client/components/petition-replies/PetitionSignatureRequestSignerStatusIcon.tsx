import { CheckIcon, CloseIcon, TimeIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
interface PetitionSignatureRequestSignerStatusIconProps {
  status: string;
}
export const PetitionSignatureRequestSignerStatusIcon = chakraForwardRef<
  "svg",
  PetitionSignatureRequestSignerStatusIconProps
>(function PetitionSignatureRequestSignerStatusIcon({ status, ...props }, ref) {
  switch (status) {
    case "SIGNED":
      return <CheckIcon ref={ref} color="green.500" {...props} />;
    case "DECLINED":
      return <CloseIcon ref={ref} color="red.500" fontSize="12px" {...props} />;
    case "PENDING":
      return <TimeIcon ref={ref} color="yellow.600" {...props} />;
    default:
      return null;
  }
});
