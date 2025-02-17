import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertProps,
  Button,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

interface PetitionPreviewApprovalsAlertProps extends AlertProps {
  onCancelApprovals: () => void;
}

export function PetitionPreviewApprovalsAlert({
  onCancelApprovals,
  ...props
}: PetitionPreviewApprovalsAlertProps) {
  return (
    <Alert status="warning" {...props}>
      <AlertIcon />
      <HStack flex={1} justify="space-between">
        <AlertDescription>
          <Stack spacing={0.5}>
            <Text>
              <FormattedMessage
                id="component.petition-preview-approvals-alert.approvals-in-progress"
                defaultMessage="<b>The information is being evaluated or has already been approved</b> and cannot be edited."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.petition-preview-approvals-alert.cancel-approvals-instructions"
                defaultMessage="If you need to correct something, cancel the approvals first."
              />
            </Text>
          </Stack>
        </AlertDescription>
        <Button size="sm" colorScheme="red" onClick={onCancelApprovals}>
          <FormattedMessage
            id="component.petition-preview-approvals-alert.cancel-approvals"
            defaultMessage="Cancel approvals"
          />
        </Button>
      </HStack>
    </Alert>
  );
}
