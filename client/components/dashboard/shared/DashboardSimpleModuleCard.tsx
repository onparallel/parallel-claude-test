import { gql } from "@apollo/client";
import { Center, Flex, FlexProps, Spinner } from "@chakra-ui/react";
import { DashboardSimpleModuleCard_DashboardModuleFragment } from "@parallel/graphql/__types";
import { forwardRef, PropsWithChildren } from "react";
import { isNonNullish } from "remeda";
import { DashboardModuleCard, DashboardModuleCardProps } from "../shared/DashboardModuleCard";

type DashboardSimpleModuleCardProps = PropsWithChildren<
  {
    module: DashboardSimpleModuleCard_DashboardModuleFragment;
    alignment?: FlexProps["justifyContent"];
  } & Omit<DashboardModuleCardProps, "title" | "children">
>;

export const DashboardSimpleModuleCard = Object.assign(
  forwardRef<HTMLDivElement, DashboardSimpleModuleCardProps>(function DashboardSimpleModuleCard(
    { module, alignment, children, ...props },
    ref,
  ) {
    return (
      <DashboardModuleCard ref={ref} module={module} {...props}>
        {isNonNullish(children) ? (
          <Flex
            alignItems="center"
            flex={1}
            fontWeight={700}
            fontSize="48px"
            justifyContent={alignment}
          >
            {children}
          </Flex>
        ) : (
          <Center flex={1}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="primary.500"
              size="xl"
            />
          </Center>
        )}
      </DashboardModuleCard>
    );
  }),
  {
    fragments: {
      DashboardModule: gql`
        fragment DashboardSimpleModuleCard_DashboardModule on DashboardModule {
          ...DashboardModuleCard_DashboardModule
        }
        ${DashboardModuleCard.fragments.DashboardModule}
      `,
    },
  },
);
