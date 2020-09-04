import {
  Box,
  layoutPropNames,
  omitThemingProps,
  SelectProps,
  useMultiStyleConfig,
} from "@chakra-ui/core";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { forwardRef } from "react";
import { omit, pick } from "remeda";

export const SelectLikeButton = forwardRef<HTMLDivElement, SelectProps>(
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
          sx={styles.field}
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
          sx={styles.icon}
        >
          <ChevronDownIcon />
        </Box>
      </Box>
    );
  }
);
