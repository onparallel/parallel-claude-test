import { gql } from "@apollo/client";
import {
  Button,
  Flex,
  HStack,
  Heading,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react";
import { Popover } from "@parallel/chakra/components";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  RecipientViewProgressBar_PetitionFieldFragment,
  RecipientViewProgressBar_PetitionFragment,
  RecipientViewProgressBar_PublicPetitionFieldFragment,
  RecipientViewProgressBar_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { generateCssStripe } from "@parallel/utils/css";
import { useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import { ArrayUnionToUnion, UnwrapArray } from "@parallel/utils/types";
import { useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { isNonNullish, zip } from "remeda";
import { ProgressIndicator, ProgressTrack } from "../common/Progress";
import { useTone } from "../common/ToneProvider";
import { Text } from "@parallel/components/ui";

type PetitionSelection =
  | RecipientViewProgressBar_PublicPetitionFragment
  | RecipientViewProgressBar_PetitionFragment;

type PetitionFieldSelection =
  | RecipientViewProgressBar_PublicPetitionFieldFragment
  | RecipientViewProgressBar_PetitionFieldFragment;

type PetitionFieldReplySelection = ArrayUnionToUnion<PetitionFieldSelection["replies"]>;

type PetitionFieldGroupChildReplySelection = UnwrapArray<
  Exclude<PetitionFieldSelection["replies"][0]["children"], null | undefined>
>;

export interface RecipientViewProgressBarProps {
  petition: PetitionSelection;
  canFinalize?: boolean;
  isDisabled?: boolean;
  onFinalize?: () => void;
}

export const RecipientViewProgressBar = chakraForwardRef<"div", RecipientViewProgressBarProps>(
  function RecipientViewProgressBar(
    { petition, isDisabled, canFinalize, onFinalize, ...props },
    ref,
  ) {
    const tone = useTone();
    const fieldLogic = useFieldLogic(petition);
    const [poppoverClosed, setPoppoverClosed] = useState(false);
    const { replied, optional, total } = useMemo(() => {
      let replied = 0;
      let optional = 0;
      let total = 0;
      for (const [field, logic] of zip(petition.fields as PetitionFieldSelection[], fieldLogic)) {
        const isHiddenToPublic = field.__typename === "PublicPetitionField" && field.isInternal;
        if (logic.isVisible && !field.isReadOnly && !isHiddenToPublic) {
          if (field.type === "FIELD_GROUP") {
            if (field.replies.length === 0) {
              optional += field.optional ? 1 : 0;
              total += 1;
            } else {
              for (const [groupReply, replyLogic] of zip(
                field.replies as PetitionFieldReplySelection[],
                logic.groupChildrenLogic!,
              )) {
                for (const [{ field, replies }, logic] of zip(
                  groupReply.children! as PetitionFieldGroupChildReplySelection[],
                  replyLogic,
                )) {
                  const isHiddenToPublic =
                    field.__typename === "PublicPetitionField" && field.isInternal;
                  const fieldReplies = completedFieldReplies({ ...field, replies } as any);
                  if (logic.isVisible && !field.isReadOnly && !isHiddenToPublic) {
                    replied += fieldReplies.length > 0 ? 1 : 0;
                    optional += field.optional && fieldReplies.length === 0 ? 1 : 0;
                    total += 1;
                  }
                }
              }
            }
          } else {
            const fieldReplies = completedFieldReplies(field);
            replied += fieldReplies.length > 0 ? 1 : 0;
            optional += field.optional && fieldReplies.length === 0 ? 1 : 0;
            total += 1;
          }
        }
      }
      return { replied, optional, total };
    }, [petition.fields, fieldLogic]);

    const isCompleted = petition.status === "COMPLETED";

    return (
      <HStack
        ref={ref}
        as="section"
        backgroundColor="white"
        paddingY={2}
        paddingX={{ base: 2, sm: 4 }}
        alignItems="center"
        {...props}
      >
        <Heading as="h3" fontSize="md" fontWeight="normal" data-testid="recipient-view-progress">
          <Text as="span">
            <FormattedMessage
              id="component.recipient-view-progress-bar.progress"
              defaultMessage="Progress {current}/{total}"
              values={{ current: replied, total }}
            />
          </Text>
        </Heading>
        <Flex flex="1">
          <ProgressTrack size="lg" min={0} max={total} value={replied} flex="1" borderRadius="1rem">
            <ProgressIndicator min={0} max={total} value={replied} backgroundColor="green.400" />

            <ProgressIndicator
              min={0}
              max={total}
              value={optional}
              backgroundColor="green.400"
              sx={generateCssStripe({
                color: "gray.200",
                size: "1rem",
              })}
            />
          </ProgressTrack>
        </Flex>
        {isNonNullish(onFinalize) ? (
          <Popover
            returnFocusOnClose={false}
            isOpen={!isDisabled && replied + optional === total && !isCompleted && !poppoverClosed}
            placement="top-end"
            closeOnBlur={false}
            onClose={() => setPoppoverClosed(true)}
            autoFocus={false}
          >
            <PopoverTrigger>
              <Button
                data-testid="recipient-view-finalize-button"
                data-action="finalize"
                colorScheme="primary"
                size="sm"
                isDisabled={isCompleted || isDisabled}
                onClick={onFinalize}
              >
                {canFinalize ? (
                  petition.signatureConfig?.isEnabled &&
                  petition.signatureConfig.review === false ? (
                    <FormattedMessage
                      id="generic.finalize-and-sign-button"
                      defaultMessage="Finalize and sign"
                    />
                  ) : (
                    <FormattedMessage id="generic.finalize-button" defaultMessage="Finalize" />
                  )
                ) : (
                  <FormattedMessage id="generic.next-button" defaultMessage="Next" />
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent backgroundColor="blue.500" color="white" marginEnd={4}>
              <PopoverArrow backgroundColor="blue.500" />
              <PopoverCloseButton />
              <PopoverBody paddingEnd={10}>
                <FormattedMessage
                  id="component.recipient-view-progress-bar.reminder-submit"
                  defaultMessage="Remember to click Finalize when you finish entering all the information."
                  values={{ tone }}
                />
              </PopoverBody>
            </PopoverContent>
          </Popover>
        ) : null}
      </HStack>
    );
  },
);

const _fragments = {
  Petition: gql`
    fragment RecipientViewProgressBar_Petition on Petition {
      status
      fields {
        id
        ...RecipientViewProgressBar_PetitionField
      }
      signatureConfig {
        isEnabled
        review
      }
      ...useFieldLogic_PetitionBase
    }

    fragment RecipientViewProgressBar_PetitionField on PetitionField {
      id
      type
      optional
      isInternal
      isReadOnly
      replies {
        id
        children {
          field {
            id
            optional
            isInternal
            isReadOnly
            ...completedFieldReplies_PetitionField
          }
          replies {
            id
            ...completedFieldReplies_PetitionFieldReply
          }
        }
      }
      ...completedFieldReplies_PetitionField
    }
  `,
  PublicPetition: gql`
    fragment RecipientViewProgressBar_PublicPetition on PublicPetition {
      status
      fields {
        id
        ...RecipientViewProgressBar_PublicPetitionField
      }
      signatureConfig {
        isEnabled
        review
      }
      ...useFieldLogic_PublicPetition
    }

    fragment RecipientViewProgressBar_PublicPetitionField on PublicPetitionField {
      id
      type
      optional
      isInternal
      isReadOnly
      replies {
        id
        children {
          field {
            id
            optional
            isInternal
            isReadOnly
            ...completedFieldReplies_PublicPetitionField
          }
          replies {
            id
            ...completedFieldReplies_PublicPetitionFieldReply
          }
        }
      }
      ...completedFieldReplies_PublicPetitionField
    }
  `,
};
