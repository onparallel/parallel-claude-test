import {
  Box,
  BoxProps,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  PseudoBox,
  PseudoBoxProps,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
  useTheme,
} from "@chakra-ui/core";
import {
  PetitionHeader_PetitionFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { forwardRef, ReactNode, Ref, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { PetitionStatusIndicator } from "../common/PetitionStatusIndicator";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";
import { PetitionSettingsModal } from "../petition-common/PetitionSettingsModal";

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
  const theme = useTheme();
  const [name, setName] = useState(petition.name ?? "");
  const {
    isOpen: isSettingsOpen,
    onOpen: onOpenSettings,
    onClose: onCloseSettings,
  } = useDisclosure();

  const lastSavedTooltip = intl.formatMessage(
    {
      id: "petition.header.last-saved-on",
      defaultMessage: "Last saved on: {date}",
    },
    {
      date: intl.formatDate(petition.updatedAt, FORMATS.FULL),
    }
  );
  const sections = useMemo(
    () => [
      {
        section: "compose",
        label: intl.formatMessage({
          id: "petition.header.compose-tab",
          defaultMessage: "Compose",
        }),
      },
      {
        section: "replies",
        label: intl.formatMessage({
          id: "petition.header.replies-tab",
          defaultMessage: "Replies",
        }),
        isDisabled: petition.status === "DRAFT",
        popoverContent: (
          <Text fontSize="sm">
            <FormattedMessage
              id="petition.replies-not-available"
              defaultMessage="Once you send this petition, you will be able to see all the replies here."
            />
          </Text>
        ),
      },
      {
        section: "activity",
        label: intl.formatMessage({
          id: "petition.header.activity-tab",
          defaultMessage: "Activity",
        }),
        isDisabled: petition.status === "DRAFT",
        popoverContent: (
          <Text fontSize="sm">
            <FormattedMessage
              id="petition.activity-not-available"
              defaultMessage="Once you send this petition, you will be able to see all the petition activity here."
            />
          </Text>
        ),
      },
    ],
    [petition.status, intl.locale]
  );
  return (
    <>
      <Box
        backgroundColor="white"
        borderBottom="2px solid"
        borderBottomColor="gray.200"
        zIndex={1}
        position="relative"
        height={{ base: 24, md: 16 }}
        {...props}
      >
        <Flex height={16} alignItems="center" paddingX={4}>
          <Flex alignItems="center">
            <PetitionStatusIndicator
              marginRight={1}
              as={Flex}
              alignItems="center"
              status={petition.status}
              isJustIcon
            />
            <Editable
              display="flex"
              value={name}
              onChange={setName}
              fontSize="xl"
              maxWidth={{
                base: "calc(100vw - 92px - 100px)",
                md: "calc((100vw - 480px)/2)",
              }}
              onSubmit={() => onUpdatePetition({ name: name || null })}
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
                  <Flex flex="1 1 auto" minWidth={0} padding={1}>
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
                  </Flex>
                  {!isEditing && (
                    <Flex
                      alignItems="center"
                      fontSize="sm"
                      position="relative"
                      display={{ base: "flex", md: "none", lg: "flex" }}
                      top="3px"
                    >
                      {state === "SAVING" ? (
                        <Text color="gray.500" fontSize="xs" fontStyle="italic">
                          <FormattedMessage
                            id="generic.saving-changes"
                            defaultMessage="Saving..."
                          />
                        </Text>
                      ) : state === "SAVED" ? (
                        <Tooltip
                          zIndex={theme.zIndices.tooltip}
                          showDelay={300}
                          aria-label={lastSavedTooltip}
                          label={lastSavedTooltip}
                        >
                          <Text
                            color="gray.500"
                            fontSize="xs"
                            fontStyle="italic"
                          >
                            <FormattedMessage
                              id="generic.changes-saved"
                              defaultMessage="Saved"
                            />
                          </Text>
                        </Tooltip>
                      ) : state === "ERROR" ? (
                        <Text color="red.500" fontSize="xs" fontStyle="italic">
                          <FormattedMessage
                            id="petition.status.error"
                            defaultMessage="Error"
                          />
                        </Text>
                      ) : null}
                    </Flex>
                  )}
                </>
              )}
            </Editable>
          </Flex>
          <Spacer minWidth={4} />
          <Stack direction="row">
            <IconButtonWithTooltip
              variant="ghost"
              icon="settings"
              label={intl.formatMessage({
                id: "petition.settings-button",
                defaultMessage: "Petition settings",
              })}
              onClick={onOpenSettings}
            />
          </Stack>
        </Flex>
        <Flex
          position="absolute"
          bottom="0"
          left="50%"
          transform="translateX(-50%)"
          direction="row"
          marginBottom="-2px"
        >
          {sections.map(({ section, label, isDisabled, popoverContent }) => {
            return isDisabled ? (
              <PetitionHeaderTab
                key={section}
                active={current === section}
                isDisabled
                popoverContent={popoverContent}
              >
                {label}
              </PetitionHeaderTab>
            ) : (
              <NakedLink
                key={section}
                href={`/app/petitions/[petitionId]/${section}`}
                as={`/app/petitions/${petition.id}/${section}`}
              >
                <PetitionHeaderTab active={current === section}>
                  {label}
                </PetitionHeaderTab>
              </NakedLink>
            );
          })}
        </Flex>
      </Box>
      <PetitionSettingsModal
        onUpdatePetition={onUpdatePetition}
        petition={petition}
        isOpen={isSettingsOpen}
        onClose={onCloseSettings}
      />
    </>
  );
}

type PetitionHeaderTabProps = PseudoBoxProps & {
  active?: boolean;
  isDisabled?: boolean;
  popoverContent?: ReactNode;
  children: ReactNode;
};

const PetitionHeaderTab = forwardRef(function (
  {
    active,
    isDisabled,
    children,
    popoverContent,
    ...props
  }: PetitionHeaderTabProps,
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
      cursor={isDisabled ? "not-allowed" : "pointer"}
      opacity={isDisabled ? 0.4 : 1}
      color={active ? "gray.900" : "gray.500"}
      _hover={
        isDisabled
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
  if (isDisabled) {
    return (
      <SmallPopover placement="right" content={popoverContent ?? null}>
        {link}
      </SmallPopover>
    );
  } else {
    return link;
  }
});

PetitionHeader.fragments = {
  Petition: gql`
    fragment PetitionHeader_Petition on Petition {
      id
      name
      status
      updatedAt
      ...PetitionSettingsModal_Petition
    }
    ${PetitionSettingsModal.fragments.Petition}
  `,
};
