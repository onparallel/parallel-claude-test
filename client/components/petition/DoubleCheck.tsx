import { ReactNode } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  Box,
  Heading,
  Icon,
  Tooltip,
  Text,
} from "@chakra-ui/core";
import { FormattedMessage } from "react-intl";
import { DateTime } from "../common/DateTime";
import { FORMATS } from "@parallel/utils/dates";

export type DoubleCheckProps = {
  sent: boolean;
  bounced: boolean;
  deliveredAt: string | null;
  openedAt: string | null;
};

export function DoubleCheck({
  sent,
  bounced,
  deliveredAt,
  openedAt,
}: DoubleCheckProps) {
  if (sent) {
    if (bounced) {
      return (
        <SmallPopover
          content={
            <>
              <Heading size="xs">
                <FormattedMessage
                  id="petitions.sendout-bounced"
                  defaultMessage="The email bounced."
                />
              </Heading>
              <Text fontSize="sm">
                <FormattedMessage
                  id="petitions.sendout-bounced-explanation"
                  defaultMessage="We couldn't deliver the email to the specified recipient. Please make sure the email is valid."
                />
              </Text>
            </>
          }
        >
          <Box display="flex">
            <Icon name="check" color="red.500" />
            <Icon marginLeft="-7px" name="check-short" color="gray.300" />
          </Box>
        </SmallPopover>
      );
    }
    return (
      <Box display="flex">
        <SmallPopover
          content={
            deliveredAt ? (
              <Text fontSize="sm">
                <FormattedMessage
                  id="petitions.sendout-delivery-explanation-confirmed"
                  defaultMessage="The email is confirmed to have been delivered on {date}"
                  values={{
                    date: (
                      <DateTime value={deliveredAt} format={FORMATS.FULL} />
                    ),
                  }}
                />
              </Text>
            ) : (
              <Text fontSize="sm">
                <FormattedMessage
                  id="petitions.sendout-delivery-explanation-not-confirmed"
                  defaultMessage="We haven't received confirmation of the delivery of the email yet."
                />
              </Text>
            )
          }
        >
          <Icon name="check" color={deliveredAt ? "green.500" : "gray.300"} />
        </SmallPopover>
        <SmallPopover
          content={
            openedAt ? (
              <Text fontSize="sm">
                <FormattedMessage
                  id="petitions.sendout-opened-explanation-confirmed"
                  defaultMessage="The email was opened on {date}"
                  values={{
                    date: <DateTime value={openedAt} format={FORMATS.FULL} />,
                  }}
                />
              </Text>
            ) : (
              <Text fontSize="sm">
                <FormattedMessage
                  id="petitions.sendout-opened-explanation-not-confirmed"
                  defaultMessage="We haven't received confirmation of the email being opened yet."
                />
              </Text>
            )
          }
        >
          <Icon
            marginLeft="-7px"
            name="check-short"
            color={openedAt ? "green.500" : "gray.300"}
          />
        </SmallPopover>
      </Box>
    );
  }
  return null;
}

function SmallPopover({
  children,
  content,
}: {
  children: ReactNode;
  content: ReactNode;
}) {
  return (
    <Popover trigger="hover" usePortal>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent zIndex={1000} maxWidth={240}>
        <PopoverArrow />
        <Box padding={2}>{content}</Box>
      </PopoverContent>
    </Popover>
  );
}
