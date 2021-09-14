import { Box, BoxProps, HStack, Stack, StackProps, Text } from "@chakra-ui/layout";
import { useRadio, useRadioGroup, UseRadioProps } from "@chakra-ui/radio";
import { ArrowRightUpIcon } from "@parallel/chakra/icons";
import { AnimateSharedLayout, motion } from "framer-motion";
import { ReactNode, useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export type PublicSwitchValues = "monthly" | "yearly";

type PublicSwitchPricingProps = {
  onChange: (nextValue: PublicSwitchValues) => void;
};

export function PublicSwitchPricing({ onChange }: PublicSwitchPricingProps) {
  const intl = useIntl();

  const options = [
    {
      label: intl.formatMessage({
        id: "component.public-switch-pricing.monthly",
        defaultMessage: "Monthly",
      }),
      value: "monthly",
    },
    {
      label: intl.formatMessage({
        id: "component.public-switch-pricing.yearly",
        defaultMessage: "Yearly",
      }),
      value: "yearly",
    },
  ];

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "billing",
    defaultValue: "monthly",
    onChange: onChange,
  });

  const group = getRootProps();

  const MotionHStack = motion<StackProps>(HStack);

  return (
    <Stack width="min-content" alignItems="center">
      <AnimateSharedLayout>
        <MotionHStack
          {...group}
          layout
          backgroundColor="gray.200"
          width="min-content"
          borderRadius="full"
          alignItems="center"
        >
          {options.map((option) => {
            const { label, value } = option;
            const radio = getRadioProps({ value });
            return (
              <RadioCard key={value} {...radio}>
                {label}
              </RadioCard>
            );
          })}
        </MotionHStack>
      </AnimateSharedLayout>
      <HStack>
        <Text fontWeight="600">
          <FormattedMessage
            id="component.public-switch-pricing.save-up-to"
            defaultMessage="Save up to {percent}%"
            values={{ percent: 15 }}
          />
        </Text>
        <ArrowRightUpIcon />
      </HStack>
    </Stack>
  );
}

interface RadioCardProps extends UseRadioProps {
  children: ReactNode;
}

function RadioCard({ children, ...props }: RadioCardProps) {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  const MotionBox = motion<Omit<BoxProps, "transition">>(Box);

  return (
    <Box as="label" position="relative">
      {props.isChecked ? (
        <MotionBox
          layoutId="underline"
          width="full"
          height="full"
          borderRadius="full"
          position="absolute"
          inset="0"
          background="white"
          boxShadow="short"
          pointerEvents="none"
          userSelect="none"
        ></MotionBox>
      ) : null}
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        fontWeight="600"
        color="gray.700"
        _checked={{
          color: "blue.600",
        }}
        _focus={{
          boxShadow: "outline",
        }}
        borderRadius="full"
        px={9}
        py={4}
        position="relative"
      >
        {children}
      </Box>
    </Box>
  );
}
