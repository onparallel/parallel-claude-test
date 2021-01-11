import {
  Box,
  layoutPropNames,
  omitThemingProps,
  SelectProps,
  useMultiStyleConfig,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { omit, pick } from "remeda";

export const SelectLikeButton = chakraForwardRef<"div", SelectProps>(
  function PetitionFieldTypeSelectButton({ children, ...props }, ref) {
    const styles = useMultiStyleConfig("Select", props);

    const { rootProps, color, ...rest } = omitThemingProps(props);

    const layoutProps = pick(rest, layoutPropNames as any);
    const otherProps = omit(rest, layoutPropNames as any);

    const rootStyles = {
      width: "100%",
      height: "fit-content",
      position: "relative",
      color,
    };
    return (
      <Box ref={ref} sx={rootStyles} {...(layoutProps as any)} {...rootProps}>
        <Box
          tabIndex={0}
          paddingBottom={0}
          paddingRight={10}
          display="flex"
          alignItems="center"
          aria-haspopup="listbox"
          sx={omit(styles.field, ["paddingBottom"]) as any}
          {...otherProps}
        >
          {children}
        </Box>
        <Box
          position="absolute"
          display="inline-flex"
          width="1.5rem"
          height="100%"
          alignItems="center"
          justifyContent="center"
          right="0.5rem"
          pointerEvents="none"
          top="50%"
          transform="translateY(-50%)"
          sx={omit(styles.icon, ["position"]) as any}
        >
          <ChevronDownIcon />
        </Box>
      </Box>
    );
  }
);
