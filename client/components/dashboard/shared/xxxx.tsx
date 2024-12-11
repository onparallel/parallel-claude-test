import { HStack } from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { OverflownText } from "@parallel/components/common/OverflownText";
import {
  DashboardModuleCard_DashboardModuleFragment,
  DashboardModuleSize,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { isNullish } from "remeda";

const BASE_HEIGHT = 125;

function getColumnSpan(size: DashboardModuleSize): number {
  switch (size) {
    case "LARGE":
      return 4;
    case "MEDIUM":
      return 2;
    case "SMALL":
      return 1;
    default:
      return 1;
  }
}

// Helper function to determine if a module is of type ratio or number
function isSmallModule(typename: string): boolean {
  return (
    typename.includes("RatioModule") ||
    typename.includes("NumberModule") ||
    typename.includes("ButtonModule")
  );
}

// Function to get module height based on type and size
function getModuleHeight(module: DashboardModuleCard_DashboardModuleFragment) {
  const height = module.__typename
    ? isSmallModule(module.__typename)
      ? BASE_HEIGHT
      : BASE_HEIGHT * 2
    : BASE_HEIGHT;
  const colSpan = getColumnSpan(module.size);

  return {
    base: "auto",
    md: colSpan > 1 ? "auto" : `${height}px`,
    lg: colSpan === 4 ? "auto" : `${height}px`,
  };
}

export function DashboardModuleCard({
  module,
  children,
}: {
  module: DashboardModuleCard_DashboardModuleFragment;
  children: React.ReactNode;
}) {
  const intl = useIntl();
  const colSpan = getColumnSpan(module.size);
  const moduleHeight = getModuleHeight(module);
  return (
    <Card
      minWidth={0}
      gridColumn={{
        base: "span 1",
        md: `span ${colSpan > 2 ? 2 : colSpan}`,
        lg: `span ${colSpan}`,
      }}
      alignSelf="stretch"
      height={moduleHeight}
      display="flex"
      flexDirection="column"
      padding={4}
    >
      <HStack marginBottom={2}>
        <OverflownText textStyle={isNullish(module.title) ? "hint" : undefined} fontWeight="bold">
          {module.title ??
            intl.formatMessage({
              id: "component.dashboard-module-card.untitled-module",
              defaultMessage: "Untitled module",
            })}
        </OverflownText>
      </HStack>
      {children}
    </Card>
  );
}

DashboardModuleCard.fragments = {
  get DashboardModule() {
    // return gql`
    //   fragment DashboardModuleCard_DashboardModule on DashboardModule {
    //     id
    //     title
    //     size
    //     ... on DashboardParallelsRatioModule {
    //       result {
    //         isIncongruent
    //       }
    //     }
    //     ... on DashboardProfilesRatioModule {
    //       result {
    //         isIncongruent
    //       }
    //     }
    //     ... on DashboardParallelsPieChartModule {
    //       result {
    //         isIncongruent
    //       }
    //     }
    //     ... on DashboardProfilesPieChartModule {
    //       result {
    //         isIncongruent
    //       }
    //     }
    //     __typename
    //   }
    // `;
  },
};
