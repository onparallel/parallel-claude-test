import { Box, Button, Flex } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { FormattedMessage } from "react-intl";
import { Card, CardHeader } from "../common/Card";

interface AdminOrganizationsSubscriptionCardProps {
  headerLabel: string;
  buttonLabel?: string | null;
  onAction: () => void;
}

export const AdminOrganizationsSubscriptionCard = chakraForwardRef<
  "div",
  AdminOrganizationsSubscriptionCardProps
>(function AdminOrganizationsSubscriptionCard(
  { headerLabel, buttonLabel, onAction, children, ...props },
  ref,
) {
  return (
    <Card display="flex" flexDirection="column" ref={ref} {...props}>
      <CardHeader>{headerLabel}</CardHeader>
      <Box padding={4} flex={1}>
        {children}
      </Box>
      <Flex as="footer" justifyContent="flex-end" padding={4} paddingTop={0}>
        <Button onClick={() => onAction()}>
          {buttonLabel ?? (
            <FormattedMessage
              id="component.admin-organizations-subscription-card.button-label"
              defaultMessage="Change subscription"
            />
          )}
        </Button>
      </Flex>
    </Card>
  );
});
