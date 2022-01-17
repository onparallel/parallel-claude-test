import { Box, omitThemingProps, SelectProps, useMultiStyleConfig } from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { omit } from "remeda";

export const SelectLikeButton = chakraForwardRef<"div", SelectProps>(
  function PetitionFieldTypeSelectButton({ children, isDisabled, ...props }, ref) {
    const styles = useMultiStyleConfig("Select", props);
    const { color, ...rest } = omitThemingProps(props as any);
    return (
      <Box
        ref={ref}
        as="button"
        disabled={isDisabled}
        tabIndex={0}
        sx={{
          ...omit(styles.field, ["paddingBottom"]),
          width: "100%",
          position: "relative",
          textAlign: "left",
          color,
        }}
        {...(rest as any)}
        aria-haspopup="listbox"
      >
        <Box paddingBottom={0} paddingRight={10} display="flex" alignItems="center">
          {children}
        </Box>
        <Box
          position="absolute"
          display="inline-flex"
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
