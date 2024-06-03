import { Box, PlacementWithLogical, Tooltip } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionBaseType } from "@parallel/graphql/__types";
import { createElement, ReactElement } from "react";
import { useIntl } from "react-intl";

interface PathNameProps {
  path: string;
  type: PetitionBaseType;
  disableTooltip?: boolean;
  tooltipPlacement?: PlacementWithLogical | undefined;
  render?: (props: any) => ReactElement;
}

export const PathName = chakraForwardRef<"span", PathNameProps>(function PathName(
  {
    path,
    type,
    disableTooltip,
    tooltipPlacement,
    render = ({ children }) => <>{children}</>,
    ...props
  },
  ref,
) {
  const intl = useIntl();
  const root =
    type === "PETITION"
      ? intl.formatMessage({
          id: "generic.root-petitions",
          defaultMessage: "Parallels",
        })
      : intl.formatMessage({
          id: "generic.root-templates",
          defaultMessage: "Templates",
        });
  const label = (`/${root}` + path).slice(0, -1);
  return (
    <Tooltip label={label} isDisabled={path === "/" || disableTooltip} placement={tooltipPlacement}>
      <Box ref={ref as any} as="span" {...props}>
        {createElement(
          render,
          {},
          <>
            {path === "/" ? root : path.replace(/^\//, "").replace(/\/$/, "").split("/").at(-1)!}
          </>,
        )}
      </Box>
    </Tooltip>
  );
});
