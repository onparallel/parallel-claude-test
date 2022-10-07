import { FocusLock } from "@chakra-ui/focus-lock";
import {
  Button,
  ButtonGroup,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Stack,
  useBreakpointValue,
  useDisclosure,
  useOutsideClick,
} from "@chakra-ui/react";
import { CloseIcon, FieldDateIcon } from "@parallel/chakra/icons";
import { FORMATS } from "@parallel/utils/dates";
import { ValueProps } from "@parallel/utils/ValueProps";
import { endOfDay, startOfDay } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { DateRangePicker, DateRangePickerProps } from "../common/DateRangePicker";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import {
  DateRange,
  isDateRangeDefined,
  isEqualDateRange,
  useQuickDateRanges,
} from "../common/useQuickDateRanges";

interface DateRangePickerButton
  extends ValueProps<[Date, Date]>,
    Omit<DateRangePickerProps, "value" | "onChange"> {}

export function DateRangePickerButton({
  value: _value,
  onChange,
  ...props
}: DateRangePickerButton) {
  const intl = useIntl();
  const [value, setValue] = useState<[Date | null, Date | null]>(_value ?? [null, null]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    if (isOpen) {
      const [startDate, endDate] = _value ?? [null, null];
      setValue([
        startDate ? startOfDay(startDate) : startDate,
        endDate ? endOfDay(endDate) : endDate,
      ]);
    }
  }, [isOpen]);

  const quickRanges = useQuickDateRanges();
  const currentActiveRange = useMemo(() => {
    return isDateRangeDefined(value) && isDefined(_value)
      ? quickRanges.find(({ range }) => isEqualDateRange(_value, range)) ?? null
      : null;
  }, [_value?.[0]?.valueOf(), _value?.[1]?.valueOf(), quickRanges]);

  const picker = (
    <DateRangePicker
      value={value}
      {...props}
      onChange={(range) => {
        setValue(range);
      }}
    />
  );

  const mainButton = (
    <Button
      leftIcon={<FieldDateIcon position="relative" top="-1px" />}
      color={isDefined(_value) ? "purple.600" : undefined}
      fontWeight={isDefined(_value) ? "600" : "500"}
      onClick={onOpen}
      width="100%"
    >
      {isDefined(currentActiveRange)
        ? currentActiveRange.text
        : isDefined(_value)
        ? _value.map((date) => intl.formatDate(date, FORMATS.LL)).join(" - ")
        : intl.formatMessage({
            id: "component.date-range-picker-button.default-text",
            defaultMessage: "All time",
          })}
    </Button>
  );

  const clearRangeButton = isDefined(_value) ? (
    <IconButtonWithTooltip
      icon={<CloseIcon fontSize={12} />}
      onClick={() => onChange(null)}
      label={intl.formatMessage({
        id: "component.date-range-picker-button.clear-range",
        defaultMessage: "Clear date range",
      })}
    />
  ) : null;

  const contentRef = useRef<HTMLDivElement>(null);
  useOutsideClick({
    ref: contentRef,
    handler: () => {
      if (!isMobile && isOpen) {
        onClose();
      }
    },
  });

  return isMobile ? (
    <>
      <ButtonGroup isAttached>
        {mainButton}
        {clearRangeButton}
      </ButtonGroup>
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
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
                id="component.date-range-picker-button.title"
                defaultMessage="Select a range of dates"
              />
            </ModalHeader>
            <ModalBody paddingX={4}>{picker}</ModalBody>
            <ModalFooter
              as={Stack}
              direction={{ base: "column", sm: "row" }}
              alignItems={{ base: "stretch" }}
            >
              <Button onClick={onClose}>
                <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
              </Button>
              <Button
                isDisabled={!isDateRangeDefined(value)}
                colorScheme="primary"
                onClick={() => {
                  onChange(value as DateRange);
                  onClose();
                }}
              >
                <FormattedMessage id="generic.apply" defaultMessage="Apply" />
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  ) : (
    <ButtonGroup isAttached>
      <Popover closeOnBlur={false} placement="bottom-start" onOpen={onOpen} isOpen={isOpen}>
        <PopoverTrigger>{mainButton}</PopoverTrigger>
        <PopoverContent width="520px" ref={contentRef}>
          <FocusLock restoreFocus>
            <PopoverHeader
              border="none"
              as="h2"
              fontSize="xl"
              fontWeight="600"
              paddingTop={4}
              paddingX={6}
            >
              <FormattedMessage
                id="component.date-range-picker-popover.title"
                defaultMessage="Select a range of dates"
              />
            </PopoverHeader>
            <PopoverBody paddingX={6} paddingY={4}>
              {picker}
            </PopoverBody>
            <PopoverFooter
              as={HStack}
              justifyContent="flex-end"
              borderTopWidth={0}
              paddingBottom={4}
              paddingX={6}
            >
              <Button onClick={onClose}>
                <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
              </Button>
              <Button
                isDisabled={!isDateRangeDefined(value)}
                colorScheme="primary"
                onClick={() => {
                  onChange(value as DateRange);
                  onClose();
                }}
              >
                <FormattedMessage id="generic.apply" defaultMessage="Apply" />
              </Button>
            </PopoverFooter>
          </FocusLock>
        </PopoverContent>
      </Popover>
      {clearRangeButton}
    </ButtonGroup>
  );
}
