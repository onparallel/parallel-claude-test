import { IconProps } from "@chakra-ui/icon";
import { CheckIcon, CloseIcon, TimeIcon } from "@parallel/chakra/icons";
interface PetitionSignatureRequestSignerStatusIconProps extends IconProps {
  status: string;
}
export function PetitionSignatureRequestSignerStatusIcon({
  status,
  ...props
}: PetitionSignatureRequestSignerStatusIconProps) {
  switch (status) {
    case "SIGNED":
      return <CheckIcon marginLeft={1} color="green.500" {...props} />;
    case "DECLINED":
      return <CloseIcon marginLeft={1} color="red.500" fontSize="12px" {...props} />;
    case "PENDING":
      return <TimeIcon marginLeft={1} color="yellow.600" {...props} />;
    default:
      return null;
  }
}
