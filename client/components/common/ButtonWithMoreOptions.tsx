import {
  Button,
  ButtonGroup,
  ButtonProps,
  layoutPropNames,
  omitThemingProps,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { omit, pick } from "remeda";
import { Divider } from "../common/Divider";
import { MoreOptionsMenuButton } from "./MoreOptionsMenuButton";

export interface ButtonWithMoreOptionsProps extends ButtonProps {
  options: ReactNode;
}

export const ButtonWithMoreOptions = chakraForwardRef<"button", ButtonWithMoreOptionsProps>(
  function ButtonWithMoreOptions({ as, options, ...props }, ref) {
    const layoutProps = pick(props, layoutPropNames as any);
    const otherProps = omitThemingProps(omit(props, layoutPropNames as any));
    const themingProps = pick(props, ["styleConfig", "size", "variant", "colorScheme"]);
    return (
      <ButtonGroup isAttached {...(layoutProps as any)} {...themingProps}>
        <Button ref={ref} as={as} {...(otherProps as any)} />
        <Divider
          isVertical
          opacity={props.isDisabled ? 0.4 : undefined}
          color={`${props.colorScheme ?? "gray"}.600`}
        />
        <MoreOptionsMenuButton
          icon={<ChevronDownIcon />}
          isDisabled={props.isDisabled}
          minWidth={"auto"}
          padding={2}
          options={options}
        />
      </ButtonGroup>
    );
  }
);
