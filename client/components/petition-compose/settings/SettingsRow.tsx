import { FormControl, FormControlProps, FormLabel } from "@chakra-ui/react";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { Spacer } from "@parallel/components/common/Spacer";
import { ReactNode } from "react";

interface SettingsRowProps extends Omit<FormControlProps, "label"> {
  label: ReactNode;
  controlId: string;
  children: ReactNode;
  description: ReactNode;
}

export function SettingsRow({
  label,
  controlId,
  description,
  children,
  ...props
}: SettingsRowProps) {
  return (
    <FormControl display="flex" alignItems="center" id={controlId} {...props}>
      <FormLabel display="flex" alignItems="center" fontWeight="normal" margin={0} minHeight={8}>
        {label}
        <HelpPopover>{description}</HelpPopover>
      </FormLabel>
      <Spacer minWidth={6} />
      {children}
    </FormControl>
  );
}
