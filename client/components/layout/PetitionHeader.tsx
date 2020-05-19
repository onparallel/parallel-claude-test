import {
  Box,
  BoxProps,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  Icon,
  IconButton,
  PseudoBox,
  PseudoBoxProps,
  Spinner,
  Text,
  Tooltip,
} from "@chakra-ui/core";
import {
  PetitionHeader_PetitionFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { forwardRef, ReactNode, Ref, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";
import { PetitionStatusText } from "../common/PetitionStatusText";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";

export type PetitionHeaderProps = BoxProps & {
  petition: PetitionHeader_PetitionFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  section: "compose" | "replies" | "activity";
  state: "SAVED" | "SAVING" | "ERROR";
};

export function PetitionHeader({
  state,
  petition,
  onUpdatePetition,
  section: current,
  ...props
}: PetitionHeaderProps) {
  const intl = useIntl();
  const [name, setName] = useState(petition.name ?? "");

  const lastSavedTooltip = intl.formatMessage(
    {
      id: "petition.header.last-saved-on",
      defaultMessage: "Last saved on: {date}",
    },
    {
      date: intl.formatDate(petition.updatedAt, FORMATS.FULL),
    }
  );
  function handleOnSubmit() {
    onUpdatePetition({ name: name || null });
  }
  return (
    <Flex
      backgroundColor="white"
      borderBottom="2px solid"
      borderBottomColor="gray.200"
      zIndex={1}
      position="relative"
      height={{ base: 24, md: 16 }}
      {...props}
    >
      <Flex
        height={16}
        padding={4}
        alignItems="center"
        maxWidth={{
          base: "calc(100vw - 92px - 100px)",
          md: "calc((100vw - 380px)/2)",
        }}
      >
        <Editable
          display="flex"
          maxWidth="100%"
          value={name}
          onChange={setName}
          fontSize="xl"
          onSubmit={handleOnSubmit}
          placeholder={
            name
              ? ""
              : intl.formatMessage({
                  id: "generic.untitled-petition",
                  defaultMessage: "Untitled petition",
                })
          }
          aria-label={intl.formatMessage({
            id: "petition.name-label",
            defaultMessage: "Petition name",
          })}
        >
          {({
            isEditing,
            onRequestEdit,
          }: {
            isEditing: boolean;
            onRequestEdit: () => void;
          }) => (
            <>
              <Box flex="1 1 auto" minWidth={0} padding={1}>
                <EditablePreview
                  paddingY={1}
                  paddingX={2}
                  display="block"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                />
                <EditableInput
                  paddingY={1}
                  paddingX={2}
                  {...{ maxLength: 255 }}
                />
              </Box>
              {!isEditing && (
                <Flex display="inline-flex" alignItems="center">
                  <IconButton
                    variant="ghost"
                    icon={"pencil" as any}
                    onClick={() => onRequestEdit()}
                    aria-label={intl.formatMessage({
                      id: "generic.edit-label",
                      defaultMessage: "Edit",
                    })}
                  />

                  <Flex
                    alignItems="center"
                    fontSize="sm"
                    marginLeft={4}
                    display={{ base: "none", sm: "flex" }}
                  >
                    {state === "SAVING" ? (
                      <Flex color="gray.500" alignItems="center">
                        <Spinner
                          size="sm"
                          marginRight={2}
                          position="relative"
                          speed="0.8s"
                          bottom="-1px"
                        />
                        <FormattedMessage
                          id="generic.saving-changes"
                          defaultMessage="Saving..."
                        />
                      </Flex>
                    ) : state === "SAVED" ? (
                      <Tooltip
                        zIndex={1000}
                        showDelay={300}
                        aria-label={lastSavedTooltip}
                        label={lastSavedTooltip}
                      >
                        <Flex color="green.500" alignItems="center">
                          <Icon
                            name="check"
                            size="16px"
                            role="presentation"
                            focusable={false}
                            marginRight={2}
                          />
                          <FormattedMessage
                            id="generic.changes-saved"
                            defaultMessage="Saved"
                          />
                        </Flex>
                      </Tooltip>
                    ) : state === "ERROR" ? (
                      <Flex color="red.500" alignItems="center">
                        <Icon
                          name="warning"
                          size="16px"
                          role="presentation"
                          focusable={false}
                          marginRight={2}
                        />
                        <FormattedMessage
                          id="petition.status.error"
                          defaultMessage="Error"
                        />
                      </Flex>
                    ) : null}
                  </Flex>
                </Flex>
              )}
            </>
          )}
        </Editable>
      </Flex>
      <Spacer />
      <Flex height={16} padding={4} alignItems="center">
        <PetitionStatusText
          display="block"
          status={petition.status}
          iconSize="14px"
          fontSize="sm"
        />
      </Flex>
      <Flex
        position="absolute"
        bottom="0"
        left="50%"
        transform="translateX(-50%)"
        direction="row"
        marginBottom="-2px"
      >
        <NakedLink
          href={`/app/petitions/[petitionId]/compose`}
          as={`/app/petitions/${petition.id}/compose`}
        >
          <PetitionHeaderTab active={current === "compose"}>
            <FormattedMessage
              id="petition.header.compose-tab"
              defaultMessage="Compose"
            />
          </PetitionHeaderTab>
        </NakedLink>
        {petition.status === "DRAFT" ? (
          <PetitionHeaderTab disabled={true}>
            <FormattedMessage
              id="petition.header.replies-tab"
              defaultMessage="Replies"
            />
          </PetitionHeaderTab>
        ) : (
          <NakedLink
            href={`/app/petitions/[petitionId]/replies`}
            as={`/app/petitions/${petition.id}/replies`}
          >
            <PetitionHeaderTab active={current === "replies"}>
              <FormattedMessage
                id="petition.header.replies-tab"
                defaultMessage="Replies"
              />
            </PetitionHeaderTab>
          </NakedLink>
        )}
        {petition.status === "DRAFT" ? (
          <PetitionHeaderTab disabled={true}>
            <FormattedMessage
              id="petition.header.activity-tab"
              defaultMessage="Activity"
            />
          </PetitionHeaderTab>
        ) : (
          <NakedLink
            href={`/app/petitions/[petitionId]/activity`}
            as={`/app/petitions/${petition.id}/activity`}
          >
            <PetitionHeaderTab active={current === "activity"}>
              <FormattedMessage
                id="petition.header.activity-tab"
                defaultMessage="Activity"
              />
            </PetitionHeaderTab>
          </NakedLink>
        )}
      </Flex>
    </Flex>
  );
}

type PetitionHeaderTabProps = PseudoBoxProps & {
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
};

const PetitionHeaderTab = forwardRef(function (
  { active, disabled, children, ...props }: PetitionHeaderTabProps,
  ref: Ref<any>
) {
  const link = (
    <PseudoBox
      as="a"
      ref={ref}
      display="block"
      paddingY={3}
      paddingX={4}
      fontSize="sm"
      textTransform="uppercase"
      borderBottom="2px solid"
      borderBottomColor={active ? "purple.500" : "transparent"}
      fontWeight="bold"
      cursor={disabled ? "not-allowed" : "pointer"}
      opacity={disabled ? 0.4 : 1}
      color={active ? "gray.900" : "gray.500"}
      _hover={
        disabled
          ? {}
          : {
              color: "purple.700",
            }
      }
      {...(active ? { "aria-current": "page" } : {})}
      {...props}
    >
      {children}
    </PseudoBox>
  );
  if (disabled) {
    return (
      <SmallPopover
        placement="right"
        content={
          <Text fontSize="sm">
            <FormattedMessage
              id="petition.replies-not-available"
              defaultMessage="Once you send this petition, you will be able to see all the replies here."
            />
          </Text>
        }
      >
        {link}
      </SmallPopover>
    );
  } else {
    return link;
  }
});

PetitionHeader.fragments = {
  petition: gql`
    fragment PetitionHeader_Petition on Petition {
      id
      name
      status
      updatedAt
    }
  `,
};
