import { Stack, StackProps } from "@chakra-ui/layout";

interface PetitionHeaderTabsProps extends StackProps {}

export const PetitionHeaderTabs = ({ children, ...props }: PetitionHeaderTabsProps) => {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      direction="row"
      position={{ base: "relative", md: "absolute" }}
      height={{ base: "40px", md: "64px" }}
      transform={{ base: "none", md: "translate(-50%)" }}
      left={{ base: 0, md: "50%" }}
      marginBottom={{ base: "10px", md: 0 }}
      bottom="0"
      {...props}
    >
      {children}
    </Stack>
  );
};
