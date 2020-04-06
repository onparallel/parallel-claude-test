import { Box, BoxProps, Collapse, IconButton, Stack } from "@chakra-ui/core";
import { ReactNode, useState } from "react";
import { useIntl } from "react-intl";

export type CollapseContentProps = BoxProps & {
  defaultIsOpen?: boolean;
  header: ReactNode;
};

export function CollapseContent({
  defaultIsOpen,
  header,
  children,
  ...props
}: CollapseContentProps) {
  const intl = useIntl();
  const [open, setOpen] = useState(defaultIsOpen ?? false);
  return (
    <Box aria-expanded={open} {...props}>
      <Stack direction="row" alignItems="center">
        {header}
        <IconButton
          variant="ghost"
          size="sm"
          icon={(open ? "chevron-up-big" : "chevron-down-big") as any}
          aria-label={
            open
              ? intl.formatMessage({
                  id: "generic.collapse",
                  defaultMessage: "Collapse",
                })
              : intl.formatMessage({
                  id: "generic.expand",
                  defaultMessage: "Expand",
                })
          }
          onClick={() => setOpen(!open)}
        />
      </Stack>
      <Collapse isOpen={open}>{children}</Collapse>
    </Box>
  );
}
