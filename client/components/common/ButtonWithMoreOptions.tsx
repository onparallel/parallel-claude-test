import {
  ButtonGroup,
  ButtonOptions,
  ButtonProps,
  layoutPropNames,
  omitThemingProps,
  ThemingProps,
  useStyleConfig,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Button } from "@parallel/components/ui";
import { ReactNode } from "react";
import { omit, pick } from "remeda";
import { Divider } from "../common/Divider";
import { MoreOptionsMenuButton } from "./MoreOptionsMenuButton";

export interface ButtonWithMoreOptionsProps extends ButtonOptions, ThemingProps<"Button"> {
  options: ReactNode;
  moreOptionsButtonProps?: ButtonProps;
}

export const ButtonWithMoreOptions = chakraForwardRef<"button", ButtonWithMoreOptionsProps>(
  function ButtonWithMoreOptions({ as, options, moreOptionsButtonProps, ...props }, ref) {
    const layoutProps = pick(props, layoutPropNames as any);
    const otherProps = omitThemingProps(omit(props, layoutPropNames as any));
    const themingProps = pick(props, ["styleConfig", "size", "variant", "colorScheme"]);
    const style = useStyleConfig("Button", { ...props });

    return (
      <ButtonGroup isAttached {...(layoutProps as any)} {...themingProps}>
        <Button ref={ref} as={as} flex="1" {...(otherProps as any)} />
        {style.border ? null : (
          <Divider
            isVertical
            opacity={props.isDisabled ? 0.4 : undefined}
            color={(style as any)._active.bg}
          />
        )}
        <MoreOptionsMenuButton
          icon={<ChevronDownIcon />}
          isDisabled={props.isDisabled}
          minWidth={"auto"}
          padding={2}
          options={options}
          {...moreOptionsButtonProps}
        />
      </ButtonGroup>
    );
  },
);
