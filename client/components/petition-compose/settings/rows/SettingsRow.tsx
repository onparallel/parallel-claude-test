import {
  Center,
  Flex,
  FormControl,
  FormControlProps,
  FormLabel,
  HStack,
  Text,
} from "@chakra-ui/react";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { PaidBadge } from "@parallel/components/common/PaidBadge";
import { PaidPopover } from "@parallel/components/common/PaidPopover";
import { ReactNode } from "react";
import { isNonNullish } from "remeda";

export interface SettingsRowProps extends Omit<FormControlProps, "label"> {
  label: ReactNode;
  icon?: ReactNode;
  isActive?: boolean;
  isVertical?: boolean;
  controlId: string;
  children: ReactNode;
  description?: ReactNode;
  showPaidBadge?: boolean;
  contactMessage?: string;
}

export function SettingsRow({
  label,
  icon,
  isActive,
  isVertical,
  controlId,
  description,
  showPaidBadge,
  contactMessage,
  children,
  ...props
}: SettingsRowProps) {
  return (
    <FormControl
      display="flex"
      justifyContent="space-between"
      id={controlId}
      data-active-setting={isActive}
      {...(isVertical
        ? {
            flexDirection: "column",
            alignItems: "stretch",
          }
        : { alignItems: "center" })}
      {...props}
    >
      <FormLabel
        display="flex"
        fontWeight="normal"
        whiteSpace="nowrap"
        margin={0}
        {...(isVertical
          ? {
              flexDirection: "column",
              alignItems: "stretch",
            }
          : { marginEnd: 4, alignSelf: "flex-start" })}
      >
        <HStack minHeight={8}>
          {icon ? <Center color={isActive ? "primary.600" : undefined}>{icon}</Center> : null}
          <Text as="span">{label}</Text>
          {description ? <HelpPopover marginStart={0}>{description}</HelpPopover> : null}
        </HStack>
      </FormLabel>
      {showPaidBadge ? (
        isNonNullish(contactMessage) ? (
          <PaidPopover contactMessage={contactMessage} />
        ) : (
          <PaidBadge />
        )
      ) : null}
      <Flex
        {...(isVertical
          ? { flexDirection: "column" }
          : { flex: 1, justifyContent: "flex-end", maxWidth: "250px", minWidth: 0 })}
      >
        {children}
      </Flex>
    </FormControl>
  );
}
