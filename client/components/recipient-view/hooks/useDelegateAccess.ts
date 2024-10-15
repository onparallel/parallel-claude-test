import { useToast } from "@chakra-ui/react";
import { useTone } from "@parallel/components/common/ToneProvider";
import { useIntl } from "react-intl";
import { useDelegateAccessDialog } from "../dialogs/DelegateAccessDialog";

export function useDelegateAccess() {
  const intl = useIntl();
  const tone = useTone();
  const showDelegateAccessDialog = useDelegateAccessDialog();

  const toast = useToast();

  return async function ({
    keycode,
    contactName,
    organizationName,
  }: {
    keycode: string;
    contactName: string;
    organizationName: string;
  }) {
    try {
      const data = await showDelegateAccessDialog({
        keycode,
        contactName,
        organizationName,
        tone,
      });

      toast({
        title: intl.formatMessage({
          id: "util.recipient-view-delegate-access.toast-header",
          defaultMessage: "Access delegated",
        }),
        description: intl.formatMessage(
          {
            id: "util.recipient-view-delegate-access.toast-body",
            defaultMessage:
              "We have sent an email to {email} with instructions to access this parallel.",
          },
          { email: data.email },
        ),
        duration: 5000,
        isClosable: true,
        status: "success",
      });
    } catch {}
  };
}
