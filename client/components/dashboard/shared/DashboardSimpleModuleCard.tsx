import { gql } from "@apollo/client";
import { Center, Spinner } from "@chakra-ui/react";
import { DashboardSimpleModuleCard_DashboardModuleFragment } from "@parallel/graphql/__types";
import { PropsWithChildren, RefAttributes } from "react";
import { Flex, FlexProps } from "@parallel/components/ui";
import { isNonNullish } from "remeda";
import { DashboardModuleCard, DashboardModuleCardProps } from "../shared/DashboardModuleCard";

type DashboardSimpleModuleCardProps = PropsWithChildren<
  {
    module: DashboardSimpleModuleCard_DashboardModuleFragment;
    alignment?: FlexProps["justifyContent"];
  } & Omit<DashboardModuleCardProps, "title" | "children">
> &
  RefAttributes<HTMLDivElement>;

export function DashboardSimpleModuleCard({
  module,
  alignment,
  children,
  ...props
}: DashboardSimpleModuleCardProps) {
  return (
    <DashboardModuleCard module={module} {...props}>
      {isNonNullish(children) ? (
        <Flex
          alignItems="center"
          flex={1}
          fontWeight={700}
          fontSize="48px"
          justifyContent={alignment}
          className="dashboard-number-module"
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
}

const _fragments = {
  DashboardModule: gql`
    fragment DashboardSimpleModuleCard_DashboardModule on DashboardModule {
      ...DashboardModuleCard_DashboardModule
    }
  `,
};
