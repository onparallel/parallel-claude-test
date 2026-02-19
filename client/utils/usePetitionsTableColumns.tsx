import { gql } from "@apollo/client";
import { IconButton, VisuallyHidden } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import {
  AlertCircleIcon,
  BellSettingsIcon,
  FolderIcon,
  ForbiddenIcon,
  SignatureIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import { CheckboxTableFilter } from "@parallel/components/common/CheckboxTableFilter";
import { ContactListPopover } from "@parallel/components/common/ContactListPopover";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { Link } from "@parallel/components/common/Link";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PetitionSignatureCellContent } from "@parallel/components/common/PetitionSignatureCellContent";
import { PetitionStatusCellContent } from "@parallel/components/common/PetitionStatusCellContent";
import { PetitionTagListCellContent } from "@parallel/components/common/PetitionTagListCellContent";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { TableColumn } from "@parallel/components/common/Table";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { WithIntl } from "@parallel/components/common/WithIntl";
import { withProps } from "@parallel/components/common/withProps";
import { PetitionListApprovalsFilter } from "@parallel/components/petition-list/filters/PetitionListApprovalsFilter";
import { PetitionListSharedWithFilter } from "@parallel/components/petition-list/filters/PetitionListSharedWithFilter";
import { PetitionListTagFilter } from "@parallel/components/petition-list/filters/PetitionListTagFilter";
import { PetitionTemplateFilter } from "@parallel/components/petition-list/filters/PetitionTemplateFilter";
import { TemplateActiveSettingsIcons } from "@parallel/components/petition-new/TemplateActiveSettingsIcons";
import { Flex, HStack, Stack, Text } from "@parallel/components/ui";
import {
  PetitionApprovalRequestStepStatus,
  PetitionBaseType,
  PetitionListViewColumn,
  PetitionSignatureStatusFilter,
  PetitionStatus,
  usePetitionsTableColumns_PetitionBaseFragment,
  usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment,
  usePetitionsTableColumns_PetitionBase_Petition_Fragment,
  usePetitionsTableColumns_PetitionFolderFragment,
  usePetitionsTableColumns_UserFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { MouseEvent, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { firstBy, isNonNullish } from "remeda";
import { EnumerateList } from "./EnumerateList";
import { useGoToContact } from "./goToContact";
import { useGoToPetition } from "./goToPetition";
import { usePetitionSignatureStatusLabels } from "./usePetitionSignatureStatusLabels";
import { usePetitionStatusLabels } from "./usePetitionStatusLabels";

type PetitionBase = usePetitionsTableColumns_PetitionBaseFragment;
type Petition = usePetitionsTableColumns_PetitionBase_Petition_Fragment;
type Template = usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment;
type PetitionFolder = usePetitionsTableColumns_PetitionFolderFragment;

export type PetitionsTableColumn = PetitionListViewColumn;

export const DEFAULT_PETITION_COLUMN_SELECTION: PetitionsTableColumn[] = [
  "recipients",
  "status",
  "signature",
  "approvals",
  "sharedWith",
  "sentAt",
  "reminders",
  "tagsFilters",
];

type PetitionsTableColumns_PetitionBaseOrFolder = TableColumn<
  PetitionBase | PetitionFolder,
  any,
  any
>;
type PetitionsTableColumns_PetitionOrFolder = TableColumn<Petition | PetitionFolder, any, any>;
type PetitionsTableColumns_PetitionTemplateOrFolder = TableColumn<
  Template | PetitionFolder,
  any,
  any
>;

export function getPetitionsTableIncludes(columns?: PetitionsTableColumn[]) {
  return {
    includeRecipients: columns ? columns.includes("recipients") : true,
    includeTemplate: columns ? columns.includes("fromTemplateId") : true,
    includeStatus: columns ? columns.includes("status") : true,
    includeSignature: columns ? columns.includes("signature") : true,
    includeSharedWith: columns ? columns.includes("sharedWith") : true,
    includeCreatedAt: columns ? columns.includes("createdAt") : true,
    includeSentAt: columns ? columns.includes("sentAt") : true,
    includeReminders: columns ? columns.includes("reminders") : true,
    includeTags: columns ? columns.includes("tagsFilters") : true,
    includeLastActivityAt: columns ? columns.includes("lastActivityAt") : true,
    includeLastRecipientActivityAt: columns ? columns.includes("lastRecipientActivityAt") : true,
    includeApprovals: columns ? columns.includes("approvals") : true,
  };
}

export function getTemplatesTableIncludes() {
  return {
    includeRecipients: false,
    includeTemplate: false,
    includeStatus: false,
    includeSignature: false,
    includeSharedWith: true,
    includeCreatedAt: true,
    includeSentAt: false,
    includeReminders: false,
    includeTags: true,
    includeLastActivityAt: false,
    includeLastRecipientActivityAt: false,
    includeApprovals: false,
  };
}

const PetitionListStatusFilter = withProps(CheckboxTableFilter<PetitionStatus>, () => {
  const statuses = usePetitionStatusLabels();
  return {
    options: useMemo(
      () =>
        Object.entries(statuses).map(([value, text]) => ({ value: value as PetitionStatus, text })),
      [],
    ),
  };
});

const PetitionListSignatureStatusFilter = withProps(
  CheckboxTableFilter<PetitionSignatureStatusFilter>,
  () => {
    const statuses = usePetitionSignatureStatusLabels();
    return {
      options: useMemo(
        () =>
          Object.entries(statuses).map(([value, text]) => ({
            value: value as PetitionSignatureStatusFilter,
            text,
          })),
        [],
      ),
    };
  },
);

export const PETITIONS_COLUMNS: PetitionsTableColumns_PetitionOrFolder[] = [
  {
    key: "name",
    isSortable: true,
    isFixed: true,
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-name",
        defaultMessage: "Name",
      }),
    cellProps: {
      maxWidth: 0,
      minWidth: "240px",
    },
    CellContent: ({ row }) =>
      row.__typename === "PetitionFolder" ? (
        <HStack>
          <Flex>
            <VisuallyHidden>
              <FormattedMessage id="generic.folder" defaultMessage="Folder" />
            </VisuallyHidden>
            <FolderIcon role="presentation" />
          </Flex>
          <OverflownText>{row.folderName}</OverflownText>
        </HStack>
      ) : row.__typename === "Petition" ? (
        <OverflownText textStyle={row.name ? undefined : "hint"}>
          {row.name || (
            <FormattedMessage id="generic.unnamed-parallel" defaultMessage="Unnamed parallel" />
          )}
        </OverflownText>
      ) : null,
  },
  {
    key: "recipients",
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-recipient",
        defaultMessage: "Recipient",
      }),
    cellProps: {
      minWidth: "200px",
      whiteSpace: "nowrap",
    },
    CellContent: ({ row }) => {
      if (row.__typename === "Petition") {
        const recipients = (row.accesses ?? [])
          .filter((a) => a.status === "ACTIVE" && isNonNullish(a.contact))
          .map((a) => a.contact!);
        if (recipients.length === 0) {
          return null;
        }
        const goToContact = useGoToContact();

        return (
          <EnumerateList
            values={recipients}
            maxItems={1}
            renderItem={({ value }, index) => (
              <ContactReference
                key={index}
                contact={value}
                onClick={(e: MouseEvent) => e.stopPropagation()}
              />
            )}
            renderOther={({ children, remaining }) => (
              <ContactListPopover contacts={remaining} onContactClick={goToContact}>
                <Link
                  href={`/app/petitions/${row.id}/activity`}
                  onClick={(e: MouseEvent) => e.stopPropagation()}
                >
                  {children}
                </Link>
              </ContactListPopover>
            )}
          />
        );
      } else {
        return null;
      }
    },
  },
  {
    key: "fromTemplateId",
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-template",
        defaultMessage: "Template",
      }),
    cellProps: {
      maxWidth: 0,
      minWidth: "200px",
      whiteSpace: "nowrap",
    },
    Filter: PetitionTemplateFilter as any,
    CellContent: ({ row }) => {
      if (row.__typename === "Petition") {
        return isNonNullish(row.fromTemplate) ? (
          isNonNullish(row.fromTemplate.myEffectivePermission) ||
          row.fromTemplate.isPublicTemplate ? (
            <OverflownText
              display="block"
              as={Link}
              href={`/app/petitions/new?${new URLSearchParams({
                template: row.fromTemplate.id,
                ...(row.fromTemplate.isPublicTemplate &&
                row.fromTemplate.myEffectivePermission === null
                  ? { public: "true" }
                  : {}),
              })}`}
              onClick={(e) => e.stopPropagation()}
            >
              {row.fromTemplate.name ? (
                row.fromTemplate.name
              ) : (
                <Text as="span" fontStyle="italic">
                  <FormattedMessage
                    id="generic.unnamed-template"
                    defaultMessage="Unnamed template"
                  />
                </Text>
              )}
            </OverflownText>
          ) : row.fromTemplate.name ? (
            <OverflownText>{row.fromTemplate.name}</OverflownText>
          ) : (
            <Text as="span" textStyle="hint">
              <FormattedMessage id="generic.unnamed-template" defaultMessage="Unnamed template" />
            </Text>
          )
        ) : null;
      } else {
        return null;
      }
    },
  },
  {
    key: "status",
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-status",
        defaultMessage: "Status",
      }),
    Filter: PetitionListStatusFilter as any,
    align: "center",
    cellProps: (row) =>
      row.__typename === "Petition"
        ? {
            minWidth: "180px",
            "data-section": "petition-progress",
            "data-petition-status": row.status,
          }
        : {},
    CellContent: ({ row }) =>
      row.__typename === "Petition" && isNonNullish(row.progress) ? (
        <PetitionStatusCellContent petition={row} />
      ) : null,
  },
  {
    key: "signature",
    header: (
      <Tooltip
        label={
          <FormattedMessage
            id="component.petitions-table-columns.header-signature"
            defaultMessage="eSignature status"
          />
        }
      >
        <SignatureIcon />
      </Tooltip>
    ),
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-signature",
        defaultMessage: "eSignature status",
      }),
    align: "left",
    Filter: PetitionListSignatureStatusFilter as any,
    headerProps: { padding: 0 },
    cellProps: { padding: 0, minWidth: "72px" },
    CellContent: ({ row }) =>
      row.__typename === "Petition" ? (
        <Flex alignItems="center" paddingEnd="2">
          <PetitionSignatureCellContent petition={row} />
        </Flex>
      ) : (
        <></>
      ),
  },
  {
    key: "approvals",

    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-approvals",
        defaultMessage: "Approvals",
      }),
    align: "left",
    Filter: PetitionListApprovalsFilter,
    headerProps: { padding: 0 },
    cellProps: { padding: 0, minWidth: "72px" },
    CellContent: ({ row }) => {
      const status =
        row.__typename === "Petition" ? row.currentApprovalRequestStatus : "NO_APPROVAL";

      const hasApprovals = row.__typename === "Petition" && isNonNullish(row.approvalFlowConfig);

      const currentApprovalRequestSteps =
        row.__typename === "Petition"
          ? isNonNullish(row.currentApprovalRequestSteps) &&
            row.currentApprovalRequestSteps.length > 0
            ? row.currentApprovalRequestSteps
            : (row.approvalFlowConfig?.map((stepConfig) => {
                return {
                  stepName: stepConfig.name,
                  status: "NOT_STARTED" as PetitionApprovalRequestStepStatus,
                };
              }) ?? [])
          : [];

      if (!hasApprovals || status === "NO_APPROVAL") {
        return <>{"-"}</>;
      }

      return (
        <SmallPopover
          width="auto"
          content={
            <Stack>
              {currentApprovalRequestSteps?.map((step, index) => {
                return (
                  <HStack key={index}>
                    <ApprovalStatusIcon status={step.status} />
                    <Text as="span">{step.stepName}</Text>
                  </HStack>
                );
              })}
            </Stack>
          }
        >
          {status === "NOT_STARTED" ? (
            <Text as="span" textStyle="hint" whiteSpace="nowrap">
              <FormattedMessage id="generic.not-started" defaultMessage="Not started" />
            </Text>
          ) : status === "PENDING" ? (
            <HStack color="yellow.600">
              <TimeIcon />
              <Text as="span" whiteSpace="nowrap">
                <FormattedMessage
                  id="util.use-petition-table-colums.approval-status-pending"
                  defaultMessage="Pending"
                />
              </Text>
            </HStack>
          ) : status === "APPROVED" ? (
            <HStack color="green.600">
              <ThumbsUpIcon />
              <Text as="span" whiteSpace="nowrap">
                <FormattedMessage
                  id="util.use-petition-table-colums.approval-status-approved"
                  defaultMessage="Approved"
                />
              </Text>
            </HStack>
          ) : status === "REJECTED" ? (
            <HStack color="red.600">
              <ThumbsDownIcon />
              <Text as="span" whiteSpace="nowrap">
                <FormattedMessage
                  id="util.use-petition-table-colums.approval-status-rejected"
                  defaultMessage="Rejected"
                />
              </Text>
            </HStack>
          ) : null}
        </SmallPopover>
      );
    },
  },
  {
    key: "sharedWith",
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-shared",
        defaultMessage: "Shared",
      }),
    Filter: PetitionListSharedWithFilter,
    align: "left",
    cellProps: { minWidth: "132px" },
    CellContent: ({ row, column }) =>
      row.__typename === "Petition" && isNonNullish(row.permissions) ? (
        <Flex justifyContent={column.align}>
          <UserAvatarList
            usersOrGroups={row.permissions.map((p) =>
              p.__typename === "PetitionUserPermission"
                ? p.user
                : p.__typename === "PetitionUserGroupPermission"
                  ? p.group
                  : (null as never),
            )}
          />
        </Flex>
      ) : null,
  },
  {
    key: "sentAt",
    isSortable: true,
    label: (intl) => intl.formatMessage({ id: "generic.sent-at", defaultMessage: "Sent at" }),
    cellProps: { minWidth: "160px" },
    CellContent: ({ row }) =>
      row.__typename === "Petition" ? (
        row.sentAt ? (
          <DateTime value={row.sentAt} format={FORMATS.LLL} useRelativeTime whiteSpace="nowrap" />
        ) : (
          <Text as="span" textStyle="hint" whiteSpace="nowrap">
            <FormattedMessage id="generic.not-sent" defaultMessage="Not sent" />
          </Text>
        )
      ) : null,
  },
  {
    key: "createdAt",
    isSortable: true,
    label: (intl) => intl.formatMessage({ id: "generic.created-at", defaultMessage: "Created at" }),
    cellProps: { minWidth: "160px" },
    CellContent: ({ row }) => {
      return row.__typename === "Petition" && isNonNullish(row.createdAt) ? (
        <DateTime value={row.createdAt} format={FORMATS.LLL} useRelativeTime whiteSpace="nowrap" />
      ) : null;
    },
  },
  {
    key: "reminders",
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-reminders",
        defaultMessage: "Reminders",
      }),
    CellContent: ({ row }) => {
      if (row.__typename === "Petition" && isNonNullish(row.accesses)) {
        const lastReminderDate = firstBy(
          row.accesses.map((a) => a.reminders?.[0]?.createdAt).filter(isNonNullish),
          [(date) => new Date(date).valueOf(), "desc"],
        );

        const nextReminderAt = firstBy(
          row.accesses.map((a) => a.nextReminderAt).filter(isNonNullish),
          (date) => new Date(date).valueOf(),
        );
        const redirect = useGoToPetition();

        return (
          <Flex
            alignItems="center"
            onClick={(e) => {
              e.stopPropagation();
              redirect(row.id, row.status === "DRAFT" ? "compose" : "activity");
            }}
            whiteSpace="nowrap"
          >
            {isNonNullish(lastReminderDate) ? (
              <DateTime
                value={lastReminderDate}
                format={{ day: "numeric", month: "long" }}
                whiteSpace="nowrap"
              />
            ) : (
              <Text as="span" textStyle="hint">
                <FormattedMessage
                  id="component.petitions-table-columns.header-reminders-disabled"
                  defaultMessage="No reminders"
                />
              </Text>
            )}
            {isNonNullish(nextReminderAt) ? (
              <WithIntl>
                {(intl) => (
                  <SmallPopover
                    content={
                      <Text color="gray.800" fontSize="sm">
                        <FormattedMessage
                          id="component.petitions-table-columns.header-reminders-next-reminder-at-popover"
                          defaultMessage="Next reminder configured for {date}"
                          values={{
                            date: <DateTime format={FORMATS.LLL} value={nextReminderAt} />,
                          }}
                        />
                      </Text>
                    }
                    placement="bottom-end"
                  >
                    <IconButton
                      marginStart={1}
                      variant="ghost"
                      aria-label={intl.formatMessage({
                        id: "component.petitions-table-columns.header-reminders-next-reminder-at",
                        defaultMessage: "Next reminder configured",
                      })}
                      size="xs"
                      icon={<BellSettingsIcon fontSize="16px" color="gray.500" />}
                    />
                  </SmallPopover>
                )}
              </WithIntl>
            ) : null}
          </Flex>
        );
      } else {
        return null;
      }
    },
  },
  {
    key: "tagsFilters",
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-tags",
        defaultMessage: "Tags",
      }),
    cellProps: {
      minWidth: "300px",
      padding: "0 !important",
    },
    Filter: PetitionListTagFilter,
    CellContent: ({ row }) =>
      row.__typename === "Petition" && isNonNullish(row.tags) ? (
        <PetitionTagListCellContent
          petition={row}
          isDisabled={isNonNullish(row.permanentDeletionAt)}
        />
      ) : null,
  },
  {
    key: "lastActivityAt",
    isSortable: true,
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-last-activity-at",
        defaultMessage: "Last activity",
      }),
    cellProps: { minWidth: "160px" },
    CellContent: ({ row }) => {
      const redirect = useGoToPetition();
      return row.__typename === "Petition" ? (
        isNonNullish(row.lastActivityAt) ? (
          <DateTime
            value={row.lastActivityAt}
            format={FORMATS.LLL}
            useRelativeTime="always"
            whiteSpace="nowrap"
            onClick={(e) => {
              e.stopPropagation();
              redirect(row.id, "activity");
            }}
          />
        ) : (
          <Text textStyle="hint" whiteSpace="nowrap">
            <FormattedMessage
              id="component.petitions-table-columns.no-activity"
              defaultMessage="No activity yet"
            />
          </Text>
        )
      ) : null;
    },
  },
  {
    key: "lastRecipientActivityAt",
    isSortable: true,
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-last-recipient-activity-at",
        defaultMessage: "Last recipient activity",
      }),
    cellProps: { minWidth: "160px" },
    CellContent: ({ row }) => {
      const redirect = useGoToPetition();
      return row.__typename === "Petition" ? (
        isNonNullish(row.lastRecipientActivityAt) ? (
          <DateTime
            value={row.lastRecipientActivityAt}
            format={FORMATS.LLL}
            useRelativeTime="always"
            whiteSpace="nowrap"
            onClick={(e) => {
              e.stopPropagation();
              redirect(row.id, "activity");
            }}
          />
        ) : (
          <Text textStyle="hint" whiteSpace="nowrap">
            <FormattedMessage
              id="component.petitions-table-columns.no-activity"
              defaultMessage="No activity yet"
            />
          </Text>
        )
      ) : null;
    },
  },
];

export const TEMPLATES_COLUMNS: PetitionsTableColumns_PetitionTemplateOrFolder[] = [
  {
    key: "name",
    isSortable: true,
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-name",
        defaultMessage: "Name",
      }),
    cellProps: {
      maxWidth: 0,
      width: "30%",
      minWidth: "240px",
    },
    CellContent: ({ row }) =>
      row.__typename === "PetitionFolder" ? (
        <HStack>
          <Flex>
            <VisuallyHidden>
              <FormattedMessage id="generic.folder" defaultMessage="Folder" />
            </VisuallyHidden>
            <FolderIcon role="presentation" />
          </Flex>
          <OverflownText>{row.folderName}</OverflownText>
        </HStack>
      ) : row.__typename === "PetitionTemplate" ? (
        <OverflownText textStyle={row.name ? undefined : "hint"}>
          {row.name || (
            <FormattedMessage id="generic.unnamed-template" defaultMessage="Unnamed template" />
          )}
        </OverflownText>
      ) : null,
  },
  {
    key: "settings",
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-settings",
        defaultMessage: "Settings",
      }),
    align: "left",
    cellProps: {
      minWidth: "205px",
    },
    CellContent: ({ row }) =>
      row.__typename === "PetitionTemplate" ? (
        <TemplateActiveSettingsIcons template={row} gap={4} />
      ) : (
        <></>
      ),
  },
  {
    key: "sharedWith",
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-shared",
        defaultMessage: "Shared",
      }),
    Filter: PetitionListSharedWithFilter,
    align: "left",
    cellProps: { minWidth: "132px" },
    CellContent: ({ row, column }) =>
      row.__typename === "PetitionTemplate" && isNonNullish(row.permissions) ? (
        <Flex justifyContent={column.align}>
          <UserAvatarList
            usersOrGroups={row.permissions.map((p) =>
              p.__typename === "PetitionUserPermission"
                ? p.user
                : p.__typename === "PetitionUserGroupPermission"
                  ? p.group
                  : (null as never),
            )}
          />
        </Flex>
      ) : null,
  },
  {
    key: "createdAt",
    isSortable: true,
    label: (intl) => intl.formatMessage({ id: "generic.created-at", defaultMessage: "Created at" }),
    cellProps: { width: "1%" },
    CellContent: ({ row }) =>
      row.__typename === "PetitionTemplate" && isNonNullish(row.createdAt) ? (
        <DateTime value={row.createdAt} format={FORMATS.LLL} useRelativeTime whiteSpace="nowrap" />
      ) : null,
  },
  {
    key: "tagsFilters",
    label: (intl) =>
      intl.formatMessage({
        id: "component.petitions-table-columns.header-tags",
        defaultMessage: "Tags",
      }),
    cellProps: {
      width: "30%",
      minWidth: "300px",
      padding: 0,
      _last: { paddingEnd: 0 },
    },
    Filter: PetitionListTagFilter,
    CellContent: ({ row }) =>
      row.__typename === "PetitionTemplate" && isNonNullish(row.tags) ? (
        <PetitionTagListCellContent
          petition={row}
          isDisabled={isNonNullish(row.permanentDeletionAt)}
        />
      ) : null,
  },
];

function ApprovalStatusIcon({ status }: { status: PetitionApprovalRequestStepStatus }) {
  switch (status) {
    case "APPROVED":
      return <ThumbsUpIcon color="green.600" />;
    case "CANCELED":
    case "REJECTED":
      return <ThumbsDownIcon color="red.600" />;
    case "PENDING":
      return <TimeIcon color="yellow.600" />;
    case "SKIPPED":
      return (
        <HStack gap={0.5}>
          <ThumbsUpIcon color="green.600" />
          <AlertCircleIcon color="yellow.600" />
        </HStack>
      );
    case "NOT_STARTED":
      return <TimeIcon color="gray.600" />;
    case "NOT_APPLICABLE":
      return <ForbiddenIcon color="gray.400" />;
    default:
      return null;
  }
}
export function usePetitionsTableColumns(
  type: PetitionBaseType,
  me: usePetitionsTableColumns_UserFragment,
): PetitionsTableColumns_PetitionBaseOrFolder[] {
  return useMemo(() => {
    if (type === "TEMPLATE") {
      return TEMPLATES_COLUMNS;
    } else {
      return PETITIONS_COLUMNS.filter((c) =>
        c.key === "approvals" ? me.hasPetitionApprovalFlow : true,
      );
    }
  }, [type]) as any;
}

const _fragments = {
  PetitionFolder: gql`
    fragment usePetitionsTableColumns_PetitionFolder on PetitionFolder {
      folderId: id
      folderName: name
    }
  `,
  PetitionBase: gql`
    fragment usePetitionsTableColumns_PetitionBase on PetitionBase {
      id
      name
      permanentDeletionAt
      createdAt @include(if: $includeCreatedAt)
      permissions @include(if: $includeSharedWith) {
        permissionType
        ... on PetitionUserPermission {
          user {
            ...UserAvatarList_User
          }
        }
        ... on PetitionUserGroupPermission {
          group {
            ...UserAvatarList_UserGroup
          }
        }
      }
      ...PetitionTagListCellContent_PetitionBase @include(if: $includeTags)
      ... on Petition {
        accesses @include(if: $includeRecipients) {
          id
          status
          contact {
            ...ContactReference_Contact
          }
        }
        accesses @include(if: $includeReminders) {
          id
          nextReminderAt
          reminders {
            createdAt
          }
        }
        sentAt @include(if: $includeSentAt)
        fromTemplate @include(if: $includeTemplate) {
          id
          name
          isPublicTemplate
          myEffectivePermission {
            permissionType
          }
        }
        ...PetitionStatusCellContent_Petition @include(if: $includeStatus)
        ...PetitionSignatureCellContent_Petition @include(if: $includeSignature)
        lastActivityAt @include(if: $includeLastActivityAt)
        lastRecipientActivityAt @include(if: $includeLastRecipientActivityAt)
        approvalFlowConfig @include(if: $includeApprovals) {
          name
        }
        currentApprovalRequestSteps @include(if: $includeApprovals) {
          id
          status
          stepName
        }
        currentApprovalRequestStatus @include(if: $includeApprovals)
      }
      ... on PetitionTemplate {
        ...TemplateActiveSettingsIcons_PetitionTemplate
      }
    }
  `,
  User: gql`
    fragment usePetitionsTableColumns_User on User {
      hasPetitionApprovalFlow: hasFeatureFlag(featureFlag: PETITION_APPROVAL_FLOW)
    }
  `,
};
