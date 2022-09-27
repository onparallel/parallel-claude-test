import { gql } from "@apollo/client";
import { Badge, Box, Button, Flex, MenuDivider, MenuItem, MenuList, Text } from "@chakra-ui/react";
import {
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  LockClosedIcon,
  TableIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  usePetitionShouldConfirmNavigation,
  usePetitionState,
} from "@parallel/components/layout/PetitionLayout";
import {
  PetitionTemplateHeader_PetitionTemplateFragment,
  PetitionTemplateHeader_QueryFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { isAtLeast } from "@parallel/utils/roles";
import { usePrintPdfTask } from "@parallel/utils/usePrintPdfTask";
import { useTemplateRepliesReportTask } from "@parallel/utils/useTemplateRepliesReportTask";
import { useRouter } from "next/router";
import { useImperativeHandle, useMemo, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";
import { LocaleBadge } from "../common/LocaleBadge";
import { MoreOptionsMenuButton } from "../common/MoreOptionsMenuButton";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";
import { usePetitionSharingDialog } from "../petition-common/dialogs/PetitionSharingDialog";
import { HeaderNameEditable, HeaderNameEditableInstance } from "./HeaderNameEditable";
import { PetitionHeaderTab } from "./PetitionHeaderTab";
import { PetitionHeaderTabs } from "./PetitionHeaderTabs";
import { PetitionSection } from "./PetitionLayout";

export interface PetitionTemplateHeaderProps extends PetitionTemplateHeader_QueryFragment {
  petition: PetitionTemplateHeader_PetitionTemplateFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  section: PetitionSection;
}

export interface PetitionTemplateHeaderInstance {
  focusName(): void;
}

export const PetitionTemplateHeader = Object.assign(
  chakraForwardRef<"div", PetitionTemplateHeaderProps, PetitionTemplateHeaderInstance>(
    function PetitionTemplateHeader(
      { petition, me, onUpdatePetition, section: current, ...props },
      ref
    ) {
      const intl = useIntl();
      const router = useRouter();
      const [state] = usePetitionState();

      const hasAdminRole = isAtLeast("ADMIN", me.role);

      const deletePetitions = useDeletePetitions();
      const [, setShouldConfirmNavigation] = usePetitionShouldConfirmNavigation();
      const handleDeleteClick = async function () {
        try {
          setShouldConfirmNavigation(false);
          await deletePetitions([petition], "TEMPLATE");
          router.push("/app/petitions?type=TEMPLATE");
        } catch {}
      };

      const clonePetitions = useClonePetitions();
      const goToPetition = useGoToPetition();
      const handleCloneClick = async function () {
        try {
          const [petitionId] = await clonePetitions({
            petitionIds: [petition.id],
          });
          goToPetition(petitionId, "compose", { query: { new: "" } });
        } catch {}
      };

      const createPetition = useCreatePetition();
      const handleUseTemplate = async function () {
        try {
          const petitionId = await createPetition({
            petitionId: petition.id,
          });
          goToPetition(petitionId, "preview", {
            query: { new: "", fromTemplate: "" },
          });
        } catch {}
      };

      const showPetitionSharingDialog = usePetitionSharingDialog();
      const handlePetitionSharingClick = async function () {
        try {
          const res = await showPetitionSharingDialog({
            userId: me.id,
            petitionIds: [petition.id],
            type: "TEMPLATE",
          });

          if (res?.close) {
            router.push("/app/petitions/new");
          }
        } catch {}
      };

      const sections = useMemo(
        () => [
          {
            rightIcon: petition.isRestricted ? <EditionRestrictedPopover /> : undefined,
            section: "compose",
            label: intl.formatMessage({
              id: "petition.header.compose-tab",
              defaultMessage: "Compose",
            }),
            attributes: {
              "data-action": "template-compose",
            },
          },
          {
            rightIcon: petition.isRestricted ? <EditionRestrictedPopover /> : undefined,
            section: "messages",
            label: intl.formatMessage({
              id: "petition.header.messages-tab",
              defaultMessage: "Messages",
            }),
            attributes: {
              "data-action": "template-messages",
            },
          },
          {
            section: "preview",
            label: intl.formatMessage({
              id: "template.header.preview-tab",
              defaultMessage: "Preview",
            }),
            attributes: {
              "data-action": "template-preview",
            },
          },
        ],
        [petition.isRestricted, intl.locale]
      );

      const handlePrintPdfTask = usePrintPdfTask();

      const handleTemplateRepliesReportTask = useTemplateRepliesReportTask();

      const editableRef = useRef<HeaderNameEditableInstance>(null);
      useImperativeHandle(ref, () => ({ focusName: () => editableRef.current?.focus() }));

      return (
        <Box
          backgroundColor="white"
          borderBottom="2px solid"
          borderBottomColor="gray.200"
          position="relative"
          {...props}
        >
          <Flex height={16} alignItems="center" paddingX={4}>
            <Badge colorScheme="primary">
              <FormattedMessage id="generic.template" defaultMessage="Template" />
            </Badge>
            <LocaleBadge locale={petition.locale} marginLeft={2} />
            <HeaderNameEditable
              ref={editableRef}
              data-action="edit-template-name"
              petition={petition}
              state={state}
              onNameChange={(name) => onUpdatePetition({ name: name || null })}
              maxWidth={{
                base: `calc(100vw - ${
                  71 /* 'template' badge width */ +
                  8 /* locale badge margin left */ +
                  24 /* locale badge width */ +
                  16 /* petition name padding l+r */ +
                  16 /* heading padding left */ +
                  164 /* use this template button width */ +
                  40 /* more options button width */ +
                  16 /* more options button margin left */ +
                  16 /* heading padding right */
                }px)`,
                sm: `calc(100vw - ${
                  96 /* left navbar width */ +
                  8 /* locale badge margin left */ +
                  71 /* 'template' badge width */ +
                  24 /* locale badge width */ +
                  16 /* petition name padding l+r */ +
                  16 /* heading padding left */ +
                  164 /* use this template button width */ +
                  40 /* more options button width */ +
                  16 /* more options button margin left */ +
                  16 /* heading padding right */
                }px)`,
                lg: `calc((100vw - ${
                  96 /* left navbar width */ + 470 /* petition navigation tabs width */
                }px)/2 - ${
                  32 /* heading padding l+r */ +
                  24 /* petition status icon width */ +
                  8 /* locale badge margin left */ +
                  24 /* locale badge width */
                }px)`,
              }}
              placeholder={
                petition.name
                  ? ""
                  : intl.formatMessage({
                      id: "generic.unnamed-template",
                      defaultMessage: "Unnamed template",
                    })
              }
              aria-label={intl.formatMessage({
                id: "generic.template-name",
                defaultMessage: "Template name",
              })}
            />
            <Spacer minWidth={4} />
            <Button
              flexShrink={0}
              onClick={handleUseTemplate}
              data-action="use-template"
              marginRight={2}
            >
              <FormattedMessage id="generic.create-petition" defaultMessage="Create parallel" />
            </Button>
            <MoreOptionsMenuButton
              variant="outline"
              options={
                <MenuList>
                  <MenuItem
                    onClick={handlePetitionSharingClick}
                    icon={<UserArrowIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="component.template-header.share-label"
                      defaultMessage="Share template"
                    />
                  </MenuItem>
                  {me.hasPetitionPdfExport ? (
                    <MenuItem
                      onClick={() => handlePrintPdfTask(petition.id)}
                      icon={<DownloadIcon display="block" boxSize={4} />}
                    >
                      <FormattedMessage
                        id="component.petition-header.export-pdf"
                        defaultMessage="Export to PDF"
                      />
                    </MenuItem>
                  ) : null}
                  {hasAdminRole ? (
                    <MenuItem
                      onClick={() => handleTemplateRepliesReportTask(petition.id)}
                      icon={<TableIcon display="block" boxSize={4} />}
                    >
                      <FormattedMessage
                        id="component.petition-header.download-results"
                        defaultMessage="Download results"
                      />
                    </MenuItem>
                  ) : null}
                  <MenuItem
                    onClick={handleCloneClick}
                    icon={<CopyIcon display="block" boxSize={4} />}
                    isDisabled={me.role === "COLLABORATOR"}
                  >
                    <FormattedMessage
                      id="component.template-header.duplicate-label"
                      defaultMessage="Duplicate template"
                    />
                  </MenuItem>
                  {petition.isPublic ? null : (
                    <>
                      <MenuDivider />
                      <MenuItem
                        color="red.500"
                        onClick={handleDeleteClick}
                        icon={<DeleteIcon display="block" boxSize={4} />}
                      >
                        <FormattedMessage
                          id="component.petition-template.delete-label"
                          defaultMessage="Delete template"
                        />
                      </MenuItem>
                    </>
                  )}
                </MenuList>
              }
            />
          </Flex>
          <PetitionHeaderTabs>
            {sections.map(({ section, label, rightIcon, attributes }) => {
              return (
                <NakedLink key={section} href={`/app/petitions/${petition.id}/${section}`}>
                  <PetitionHeaderTab
                    isActive={current === section}
                    rightIcon={rightIcon}
                    {...attributes}
                  >
                    {label}
                  </PetitionHeaderTab>
                </NakedLink>
              );
            })}
          </PetitionHeaderTabs>
        </Box>
      );
    }
  ),
  {
    fragments: {
      PetitionTemplate: gql`
        fragment PetitionTemplateHeader_PetitionTemplate on PetitionTemplate {
          id
          locale
          isPublic
          isRestricted
          ...HeaderNameEditable_PetitionBase
          ...useDeletePetitions_PetitionBase
        }
        ${HeaderNameEditable.fragments.PetitionBase}
        ${useDeletePetitions.fragments.PetitionBase}
      `,
      Query: gql`
        fragment PetitionTemplateHeader_Query on Query {
          me {
            id
            role
            hasPetitionPdfExport: hasFeatureFlag(featureFlag: PETITION_PDF_EXPORT)
          }
        }
      `,
    },
  }
);

function EditionRestrictedPopover() {
  return (
    <SmallPopover
      content={
        <Text fontSize="sm">
          <FormattedMessage
            id="component.petition-header.compose-tab.readonly"
            defaultMessage="Edition restricted. To make changes, you can disable the protection on the Settings tab."
          />
        </Text>
      }
    >
      <LockClosedIcon color="gray.600" _hover={{ color: "gray.700" }} />
    </SmallPopover>
  );
}
