import { List } from "@chakra-ui/layout";
import { chakraForwardRef } from "@parallel/chakra/utils";

export const PetitionHeaderTabs = chakraForwardRef<"ul">(function PetitionHeaderTabs(
  { children, ...props },
  ref
) {
  return (
    <List
      ref={ref}
      display="flex"
      alignItems="stretch"
      justifyContent="center"
      position={{ base: "relative", lg: "absolute" }}
      height={{ base: "40px", lg: "64px" }}
      transform={{ base: "none", lg: "translate(-50%)" }}
      left={{ base: 0, lg: "50%" }}
      bottom="0"
      {...props}
    >
      {children}
    </List>
  );
});
