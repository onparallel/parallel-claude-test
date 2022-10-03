import { FocusLock } from "@chakra-ui/focus-lock";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  useBreakpointValue,
} from "@chakra-ui/react";
import { CloseIcon, FieldDateIcon } from "@parallel/chakra/icons";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { DateRangePicker, QuickRangeType } from "../common/DateRangePicker";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";

export function DateRangePickerButton({
  startDate = null,
  endDate = null,
  onChange,
  onRemoveFilter,
}: {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (range: [Date, Date]) => void;
  onRemoveFilter: () => void;
}) {
  const intl = useIntl();
  const [quickRangeApplied, setQuickRangeApplied] = useState<QuickRangeType | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleRemoveFilter = () => {
    setQuickRangeApplied(null);
    onRemoveFilter();
  };

  let buttonText = intl.formatMessage({
    id: "page.reports.any-date",
    defaultMessage: "Any date",
  });

  if (quickRangeApplied && startDate && endDate) {
    const { amount, type } = quickRangeApplied;
    if (type === "DAYS") {
      buttonText = intl.formatMessage(
        {
          id: "generic.last-x-days",
          defaultMessage: "Last {days} days",
        },
        {
          days: amount,
        }
      );
    } else {
      buttonText = intl.formatMessage(
        {
          id: "generic.last-x-months",
          defaultMessage: "Last {months} months",
        },
        {
          months: amount,
        }
      );
    }
  } else if (startDate && endDate) {
    buttonText = `${intl.formatDate(startDate, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })} - ${intl.formatDate(endDate, { day: "numeric", month: "short", year: "numeric" })}`;
  }

  const dateRangePicker = (
    <DateRangePicker
      startDate={startDate}
      endDate={endDate}
      isPastAllowed
      isFutureAllowed={false}
      onChange={(range, quickRange) => {
        onChange(range);
        setQuickRangeApplied(quickRange);
        setIsOpen(false);
      }}
      onCancel={() => setIsOpen(false)}
    />
  );

  const mainButton = (
    <Button
      leftIcon={<FieldDateIcon position="relative" top="-1px" />}
      color={startDate && endDate ? "purple.600" : undefined}
      fontWeight={startDate && endDate ? "600" : "500"}
      onClick={() => setIsOpen((current) => !current)}
      width="100%"
    >
      {buttonText}
    </Button>
  );

  const closeButton =
    startDate && endDate ? (
      <IconButtonWithTooltip
        icon={<CloseIcon fontSize={12} />}
        onClick={handleRemoveFilter}
        label={intl.formatMessage({
          id: "component.date-range-picker-popover.clear-filter",
          defaultMessage: "Clear filter",
        })}
      />
    ) : null;

  return isMobile ? (
    <>
      <ButtonGroup isAttached>
        {mainButton}
        {closeButton}
      </ButtonGroup>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="sm">
        <ModalOverlay>
          <ModalContent>
            <ModalCloseButton
              aria-label={intl.formatMessage({
                id: "generic.close",
                defaultMessage: "Close",
              })}
            />
            <ModalHeader>
              <FormattedMessage
                id="component.date-range-picker-popover.title"
                defaultMessage="Select a range of dates"
              />
            </ModalHeader>
            <ModalBody paddingTop={0} paddingX={4} paddingBottom={6}>
              {dateRangePicker}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  ) : (
    <ButtonGroup isAttached>
      <Popover
        closeOnBlur={false}
        placement="bottom-start"
        onOpen={() => {
          setIsOpen(true);
        }}
        isOpen={isOpen}
      >
        <PopoverTrigger>{mainButton}</PopoverTrigger>
        <PopoverContent width="max-content" padding={4} paddingX={6}>
          <FocusLock restoreFocus>
            <PopoverHeader border="none" as="h2" fontSize="xl" fontWeight="600" padding={0}>
              <FormattedMessage
                id="component.date-range-picker-popover.title"
                defaultMessage="Select a range of dates"
              />
            </PopoverHeader>
            <PopoverBody padding={0} marginTop={6}>
              {dateRangePicker}
            </PopoverBody>
          </FocusLock>
        </PopoverContent>
      </Popover>
      {closeButton}
    </ButtonGroup>
  );
}
