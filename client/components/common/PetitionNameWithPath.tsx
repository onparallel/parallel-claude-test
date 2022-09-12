import { gql } from "@apollo/client";
import { Text, TextProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionName_PetitionBaseFragment } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";

interface PetitionNameWithPathProps extends TextProps {
  petition: PetitionName_PetitionBaseFragment;
  relativePath?: string;
}

export const PetitionNameWithPath = Object.assign(
  chakraForwardRef<"div", PetitionNameWithPathProps>(function PetitionName(
    { children, petition, relativePath, ...props },
    ref
  ) {
    const intl = useIntl();
    return (
      <Text as="span" {...props}>
        <Text as="span" fontWeight="normal">
          {isDefined(relativePath) && petition.path.startsWith(relativePath)
            ? petition.path.slice(relativePath.length)
            : null}
        </Text>
        <Text ref={ref} as="span" textStyle={petition.name ? undefined : "hint"}>
          {petition.name ??
            (petition.__typename === "Petition"
              ? intl.formatMessage({
                  id: "generic.unnamed-parallel",
                  defaultMessage: "Unnamed parallel",
                })
              : intl.formatMessage({
                  id: "generic.unnamed-template",
                  defaultMessage: "Unnamed template",
                }))}
        </Text>
      </Text>
    );
  }),
  {
    fragments: {
      PetitionBase: gql`
        fragment PetitionName_PetitionBase on PetitionBase {
          name
          path
        }
      `,
    },
  }
);
