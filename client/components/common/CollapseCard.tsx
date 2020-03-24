import { BoxProps, Collapse, IconButton, Stack } from "@chakra-ui/core";
import { Children, ReactNode, useState } from "react";
import { Card } from "./Card";
import { Spacer } from "./Spacer";
import { useIntl } from "react-intl";

export type CollapseCardProps = BoxProps & {
  defaultIsOpen?: boolean;
  header: ReactNode;
};

export function CollapseCard({
  defaultIsOpen,
  header,
  children,
  ...props
}: CollapseCardProps) {
  const intl = useIntl();
  const [open, setOpen] = useState(defaultIsOpen ?? false);
  return (
    <Card aria-expanded={open} {...props}>
      <Stack direction="row" alignItems="center" padding={4}>
        {header}
        <Spacer />
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
    </Card>
  );
}
