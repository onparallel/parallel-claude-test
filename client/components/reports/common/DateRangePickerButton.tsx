import {
  ButtonGroup,
  FocusLock,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Stack,
  useBreakpointValue,
  useDisclosure,
  useOutsideClick,
} from "@chakra-ui/react";
import { Popover } from "@parallel/chakra/components";
import { CloseIcon, FieldDateIcon } from "@parallel/chakra/icons";
import { Button } from "@parallel/components/ui";
import { FORMATS } from "@parallel/utils/dates";
import { ValueProps } from "@parallel/utils/ValueProps";
import { endOfDay, startOfDay } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { DateRangePicker, DateRangePickerProps } from "../../common/DateRangePicker";
import { IconButtonWithTooltip } from "../../common/IconButtonWithTooltip";
import {
  DateRange,
  isDateRangeDefined,
  isEqualDateRange,
  useQuickDateRanges,
} from "../../common/useQuickDateRanges";

interface DateRangePickerButton
  extends ValueProps<[Date, Date]>,
    Omit<DateRangePickerProps, "value" | "onChange"> {
  isDisabled?: boolean;
}

export function DateRangePickerButton({
  value: _value,
  onChange,
  isDisabled,
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
    return isDateRangeDefined(value) && isNonNullish(_value)
      ? (quickRanges.find(({ range }) => isEqualDateRange(_value, range)) ?? null)
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
      color={isNonNullish(_value) ? "purple.600" : undefined}
      fontWeight={isNonNullish(_value) ? "600" : "500"}
      onClick={onOpen}
      width="100%"
      disabled={isDisabled}
    >
      {isNonNullish(currentActiveRange)
        ? currentActiveRange.text
        : isNonNullish(_value)
          ? _value.map((date) => intl.formatDate(date, FORMATS.ll)).join(" - ")
          : intl.formatMessage({
              id: "component.date-range-picker-button.default-text",
              defaultMessage: "All time",
            })}
    </Button>
  );

  const clearRangeButton = isNonNullish(_value) ? (
    <IconButtonWithTooltip
      icon={<CloseIcon fontSize={12} />}
      onClick={() => onChange(null)}
      label={intl.formatMessage({
        id: "component.date-range-picker-button.clear-range",
        defaultMessage: "Clear date range",
      })}
      disabled={isDisabled}
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
                disabled={!isDateRangeDefined(value)}
                colorPalette="primary"
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
        <Portal>
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
                  disabled={!isDateRangeDefined(value)}
                  colorPalette="primary"
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
        </Portal>
      </Popover>
      {clearRangeButton}
    </ButtonGroup>
  );
}
