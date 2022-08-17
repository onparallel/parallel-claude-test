import { Box, Tooltip } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionBaseType } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";

interface PathNameProps {
  path: string;
  type: PetitionBaseType;
  disableTooltip?: boolean;
}

export const PathName = chakraForwardRef<"span", PathNameProps>(function PathName(
  { path, type, disableTooltip, ...props },
  ref
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
    <Tooltip label={label} isDisabled={path === "/" || disableTooltip}>
      <Box ref={ref as any} as="span" {...props}>
        {path === "/" ? root : path.replace(/^\//, "").replace(/\/$/, "").split("/").at(-1)!}
      </Box>
    </Tooltip>
  );
});
