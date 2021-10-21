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
      position={{ base: "relative", md: "absolute" }}
      height={{ base: "40px", md: "64px" }}
      transform={{ base: "none", md: "translate(-50%)" }}
      left={{ base: 0, md: "50%" }}
      marginBottom={{ base: "10px", md: 0 }}
      bottom="0"
      {...props}
    >
      {children}
    </List>
  );
});
