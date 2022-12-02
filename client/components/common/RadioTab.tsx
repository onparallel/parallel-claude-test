import {
  chakra,
  StylesProvider,
  ThemingProps,
  useMultiStyleConfig,
  useRadio,
  useRadioGroup,
  UseRadioGroupProps,
  useStyles,
} from "@chakra-ui/react";
import { cx } from "@chakra-ui/utils";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ChangeEvent, createContext, useContext } from "react";

const RadioTabContext = createContext<ReturnType<typeof useRadioGroup>["getRadioProps"]>(
  null as any
);
interface RadioTabListProps extends Omit<UseRadioGroupProps, "isNative">, ThemingProps<"Tabs"> {}

export const RadioTabList = chakraForwardRef<"div", RadioTabListProps>(function ViewTabs(
  { value, defaultValue, onChange, isDisabled, isFocusable, name, ...props },
  ref
) {
  const { getRadioProps, getRootProps } = useRadioGroup({
    value,
    defaultValue,
    onChange,
    isDisabled,
    isFocusable,
    name,
  });
  const styles = useMultiStyleConfig("Tabs", props);

  return (
    <StylesProvider value={styles}>
      <RadioTabContext.Provider value={getRadioProps}>
        <chakra.div
          ref={ref}
          {...getRootProps()}
          className={cx("chakra-radio-tabs__radiotablist", props.className)}
          __css={{ display: "flex", ...styles.tablist }}
          {...props}
        />
      </RadioTabContext.Provider>
    </StylesProvider>
  );
});
interface RadioTabProps {
  value?: string | number;
  isChecked?: boolean;
  defaultChecked?: boolean;
  isDisabled?: boolean;
  isFocusable?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const RadioTab = chakraForwardRef<"label", RadioTabProps>(function RadioTab(
  { ...props },
  ref
) {
  const getRadioProps = useContext(RadioTabContext);
  const { getInputProps, getCheckboxProps, htmlProps } = useRadio(getRadioProps(props as any));

  const styles = useStyles();
  const inputProps = getInputProps();
  return (
    <chakra.label
      ref={ref as any}
      {...getCheckboxProps()}
      aria-selected={(inputProps as any).checked}
      {...htmlProps}
      className={cx("chakra-radio-tabs__radiotab", props.className)}
      __css={{ display: "flex", ...styles.tab }}
    >
      <input {...getInputProps()} />
      {props.children}
    </chakra.label>
  );
});
