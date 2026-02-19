import {
  // eslint-disable-next-line no-restricted-imports
  Menu as ChakraMenu,
  // eslint-disable-next-line no-restricted-imports
  Popover as ChakraPopover,
  // eslint-disable-next-line no-restricted-imports
  Select as ChakraSelect,
  // eslint-disable-next-line no-restricted-imports
  Tooltip as ChakraTooltip,
  ComponentWithAs,
} from "@chakra-ui/react";
import { ComponentProps, FunctionComponent } from "react";
import { ChevronDownIcon } from "./icons";

function withChakraDefaultProps<
  C extends ComponentWithAs<any, any>,
  const PD extends Partial<ComponentProps<C>>,
>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: C,
  defaults: PD,
): C {
  const Wrapped = (props: any) => <Component {...defaults} {...props} />;
  Wrapped.displayName = `WithChakraDefaultProps(${Component.displayName ?? Component.name})`;
  return Wrapped as any;
}

function withDefaultProps<
  C extends FunctionComponent<any>,
  const PD extends Partial<ComponentProps<C>>,
>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: C,
  defaults: PD,
): C {
  const Wrapped = (props: any) => <Component {...defaults} {...props} />;
  Wrapped.displayName = `WithDefaultProps(${Component.displayName ?? Component.name})`;
  return Wrapped as any;
}

export const Tooltip = withChakraDefaultProps(ChakraTooltip, {
  hasArrow: true,
  openDelay: 250,
  closeDelay: 150,
  arrowSize: 8,
  borderRadius: 4,
});

export const Menu = withDefaultProps(ChakraMenu, {
  isLazy: true,
  strategy: "fixed",
});

export const Popover = withDefaultProps(ChakraPopover, {
  openDelay: 250,
  isLazy: true,
  strategy: "fixed",
});

export const Select = withChakraDefaultProps(ChakraSelect, {
  icon: <ChevronDownIcon fontSize="16px" />,
});
