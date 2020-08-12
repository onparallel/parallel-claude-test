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

    const layoutProps = pick(rest, layoutPropNames as string[]);
    const otherProps = omit(rest, layoutPropNames as string[]);

    const rootStyles = {
      width: "100%",
      height: "fit-content",
      position: "relative",
      color,
    };
    return (
      <Box ref={ref} sx={rootStyles} {...layoutProps} {...rootProps}>
        <Box
          tabIndex={0}
          sx={{
            ...styles.field,
            paddingBottom: 0,
            paddingRight: 10,
            display: "flex",
            alignItems: "center",
          }}
          {...otherProps}
          aria-haspopup="listbox"
        >
          {children}
        </Box>
        <Box
          sx={{
            ...styles.icon,
            position: "absolute",
            display: "inline-flex",
            width: "1.5rem",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            right: "0.5rem",
            pointerEvents: "none",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <ChevronDownIcon />
        </Box>
      </Box>
    );
  }
);
