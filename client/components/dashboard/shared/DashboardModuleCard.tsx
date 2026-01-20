import { gql } from "@apollo/client";
import { Box, Button, Flex, HStack } from "@chakra-ui/react";
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { DeleteIcon, DragHandleIcon, SettingsIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card, CardProps } from "@parallel/components/common/Card";
import { ConfimationPopover } from "@parallel/components/common/ConfirmationPopover";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { DashboardModuleCard_DashboardModuleFragment } from "@parallel/graphql/__types";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";

export interface DashboardModuleCardProps extends CardProps {
  module: DashboardModuleCard_DashboardModuleFragment;
  isEditing: boolean;
  isDragging: boolean;
  isReadOnly: boolean;
  onEdit: () => void;
  onDelete: () => void;
  headerAddon?: ReactNode;
  linkToResults?: ReactNode;
  children: ReactNode;
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
}

export const DashboardModuleCard = chakraForwardRef<"section", DashboardModuleCardProps>(
  function DashboardModuleCard(
    {
      module,
      children,
      headerAddon,
      linkToResults,
      isEditing,
      isReadOnly,
      onEdit,
      onDelete,
      isDragging,
      attributes,
      listeners,
      ...props
    },
    ref,
  ) {
    const intl = useIntl();

    const colSpan = { SMALL: 1, MEDIUM: 2, LARGE: 4 }[module.size];

    return (
      <Card
        ref={ref}
        minWidth={0}
        alignSelf="stretch"
        display="flex"
        flexDirection="column"
        padding={4}
        gridAutoFlow="row dense"
        gridColumnStart={{
          base: "span 1",
          md: `span ${Math.min(2, colSpan)}`,
          lg: `span ${colSpan}`,
        }}
        gridRow={props.gridRow ?? "span 1"}
        opacity={isDragging ? 0.4 : 1}
        cursor={isDragging ? "grabbing" : "default"}
        position="relative"
        overflow="hidden"
        zIndex={isDragging ? 10 : 1}
        data-testid="dashboard-module-card"
        {...props}
      >
        {isEditing && !isReadOnly && (
          <Box
            className="dashboard-module-card-drag-handle"
            data-testid="dashboard-module-card-drag-handle"
            display="flex"
            position="absolute"
            alignItems="center"
            justifyContent="flex-start"
            top="0"
            insetStart="0"
            flexDirection="column"
            padding={2}
            width="100%"
            height="100%"
            cursor="grab"
            color="gray.400"
            _hover={{
              color: "gray.600",
            }}
            aria-label={intl.formatMessage({
              id: "component.dashboard-module-card.drag-to-sort-label",
              defaultMessage: "Drag to sort this dashboard module",
            })}
            {...attributes}
            {...listeners}
          >
            <DragHandleIcon role="presentation" transform="rotate(90deg)" />
          </Box>
        )}
        <HStack as="header" marginBottom={1} fontSize="lg" minHeight={"32px"} spacing={1}>
          <OverflownText
            flex={1}
            textStyle={isNullish(module.title) ? "hint" : undefined}
            fontWeight="bold"
          >
            {isNonNullish(module.title)
              ? module.title
              : intl.formatMessage({
                  id: "component.dashboard-module-card.untitled-module",
                  defaultMessage: "Untitled module",
                })}
          </OverflownText>
          {isEditing ? (
            <>
              <HStack spacing={1} alignSelf="flex-end">
                <IconButtonWithTooltip
                  size="sm"
                  variant="ghost"
                  bgColor="white"
                  icon={<SettingsIcon boxSize={4} />}
                  onClick={onEdit}
                  isDisabled={isReadOnly}
                  label={intl.formatMessage({
                    id: "generic.edit",
                    defaultMessage: "Edit",
                  })}
                />
                <ConfimationPopover
                  description={
                    <FormattedMessage
                      id="component.dashboard-module-card.confirm-delete"
                      defaultMessage="Do you want to delete this module?"
                    />
                  }
                  confirm={
                    <Button onClick={onDelete} size="sm" colorScheme="red">
                      <FormattedMessage id="generic.delete" defaultMessage="Delete" />
                    </Button>
                  }
                >
                  <IconButtonWithTooltip
                    size="sm"
                    variant="ghost"
                    bgColor="white"
                    icon={<DeleteIcon boxSize={4} />}
                    isDisabled={isReadOnly}
                    label={intl.formatMessage({
                      id: "generic.delete",
                      defaultMessage: "Delete",
                    })}
                  />
                </ConfimationPopover>
              </HStack>
            </>
          ) : (
            <>{headerAddon}</>
          )}
        </HStack>
        <Flex
          flexDirection="column"
          minWidth={0}
          flex="1"
          overflow="hidden"
          pointerEvents={isEditing ? "none" : "auto"}
          opacity={isEditing ? 0.7 : 1}
          filter={isEditing ? "blur(1px)" : "none"}
          data-testid="dashboard-module-content"
        >
          {children}
        </Flex>
      </Card>
    );
  },
);

const _fragments = {
  DashboardModule: gql`
    fragment DashboardModuleCard_DashboardModule on DashboardModule {
      id
      title
      size
    }
  `,
};
