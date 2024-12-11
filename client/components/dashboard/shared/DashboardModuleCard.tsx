import { gql } from "@apollo/client";
import { HStack } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card, CardProps } from "@parallel/components/common/Card";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { DashboardModuleCard_DashboardModuleFragment } from "@parallel/graphql/__types";
import { ReactNode } from "react";
import { useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";

export interface DashboardModuleCardProps extends CardProps {
  module: DashboardModuleCard_DashboardModuleFragment;
  headerAddon?: ReactNode;
  rows?: number;
  children: ReactNode;
}

export const DashboardModuleCard = Object.assign(
  chakraForwardRef<"section", DashboardModuleCardProps>(function DashboardModuleCard(
    { module, children, headerAddon, rows, ...props },
    ref,
  ) {
    const intl = useIntl();

    const colSpan = { SMALL: 1, MEDIUM: 2, LARGE: 4 }[module.size];

    return (
      <Card
        ref={ref}
        minWidth={0}
        alignSelf="stretch"
        display="flex"
        flexDirection="column"
        padding={4}
        gridAutoFlow="row dense"
        gridColumnStart={{
          base: "span 1",
          md: `span ${Math.min(2, colSpan)}`,
          lg: `span ${colSpan}`,
        }}
        gridRow={`span ${rows ?? 1}`}
        {...props}
      >
        <HStack as="header" marginBottom={2} fontSize="lg">
          <OverflownText textStyle={isNullish(module.title) ? "hint" : undefined} fontWeight="bold">
            {isNonNullish(module.title)
              ? module.title
              : intl.formatMessage({
                  id: "component.dashboard-module-card.untitled-module",
                  defaultMessage: "Untitled module",
                })}
          </OverflownText>
          {headerAddon}
        </HStack>
        {children}
      </Card>
    );
  }),
  {
    fragments: {
      DashboardModule: gql`
        fragment DashboardModuleCard_DashboardModule on DashboardModule {
          title
          size
        }
      `,
    },
  },
);
