import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  Heading,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  RecipientViewProgressFooter_PetitionFieldFragment,
  RecipientViewProgressFooter_PetitionFragment,
  RecipientViewProgressFooter_PublicPetitionFieldFragment,
  RecipientViewProgressFooter_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { generateCssStripe } from "@parallel/utils/css";
import { useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import { ArrayUnionToUnion, UnwrapArray } from "@parallel/utils/types";
import { useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { zip } from "remeda";
import { ProgressIndicator, ProgressTrack } from "../common/Progress";
import { useTone } from "../common/ToneProvider";

type PetitionSelection =
  | RecipientViewProgressFooter_PublicPetitionFragment
  | RecipientViewProgressFooter_PetitionFragment;

type PetitionFieldSelection =
  | RecipientViewProgressFooter_PublicPetitionFieldFragment
  | RecipientViewProgressFooter_PetitionFieldFragment;

type PetitionFieldReplySelection = ArrayUnionToUnion<PetitionFieldSelection["replies"]>;

type PetitionFieldGroupChildReplySelection = UnwrapArray<
  Exclude<PetitionFieldSelection["replies"][0]["children"], null | undefined>
>;

export interface RecipientViewProgressFooterProps {
  petition: PetitionSelection;
  onFinalize: () => void;
  isDisabled?: boolean;
}

export const RecipientViewProgressFooter = Object.assign(
  chakraForwardRef<"div", RecipientViewProgressFooterProps>(function RecipientViewProgressFooter(
    { petition, onFinalize, isDisabled, ...props },
    ref,
  ) {
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

    const tone = useTone();

    const isCompleted = petition.status === "COMPLETED";
    return (
      <Flex
        ref={ref}
        as="section"
        backgroundColor="white"
        boxShadow="short"
        borderTop="1px solid"
        borderTopColor="gray.200"
        paddingY={2}
        paddingX={{ base: 2, sm: 4 }}
        alignItems="center"
        {...props}
      >
        <Heading as="h3" fontSize="md" fontWeight="normal" data-testid="recipient-view-progress">
          <Text as="span">
            <FormattedMessage
              id="recipient-view.progress"
              defaultMessage="Progress {current}/{total}"
              values={{ current: replied, total }}
            />
          </Text>
        </Heading>
        <Flex flex="1" marginX={4}>
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
          <Box
            borderRadius="full"
            width="1rem"
            height="1rem"
            backgroundColor={isCompleted ? "green.400" : "gray.200"}
            marginStart={2}
          />
        </Flex>
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
              {petition.signatureConfig?.review === false ? (
                <FormattedMessage
                  id="recipient-view.submit-and-sign-button-short"
                  defaultMessage="Finalize and sign"
                />
              ) : (
                <FormattedMessage
                  id="recipient-view.submit-button-short"
                  defaultMessage="Finalize"
                />
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent backgroundColor="blue.500" color="white" marginEnd={4}>
            <PopoverArrow backgroundColor="blue.500" />
            <PopoverCloseButton />
            <PopoverBody paddingEnd={10}>
              <FormattedMessage
                id="component.recipient-view.reminder-submit"
                defaultMessage="Remember to click Finalize when you finish entering all the information."
                values={{ tone }}
              />
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Flex>
    );
  }),
  {
    fragments: {
      get Petition() {
        return gql`
          fragment RecipientViewProgressFooter_Petition on Petition {
            status
            fields {
              id
              ...RecipientViewProgressFooter_PetitionField
            }
            signatureConfig {
              review
            }
            ...useFieldLogic_PetitionBase
          }

          fragment RecipientViewProgressFooter_PetitionField on PetitionField {
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
          ${useFieldLogic.fragments.PetitionBase}
          ${completedFieldReplies.fragments.PetitionField}
          ${completedFieldReplies.fragments.PetitionFieldReply}
        `;
      },
      get PublicPetition() {
        return gql`
          fragment RecipientViewProgressFooter_PublicPetition on PublicPetition {
            status
            fields {
              id
              ...RecipientViewProgressFooter_PublicPetitionField
            }
            signatureConfig {
              review
            }
            ...useFieldLogic_PublicPetition
          }

          fragment RecipientViewProgressFooter_PublicPetitionField on PublicPetitionField {
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
          ${useFieldLogic.fragments.PublicPetition}
          ${completedFieldReplies.fragments.PublicPetitionField}
          ${completedFieldReplies.fragments.PublicPetitionFieldReply}
        `;
      },
    },
  },
);
