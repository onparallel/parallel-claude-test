import { Button, RadioProps, Stack, useRadio } from "@chakra-ui/react";

export function ModuleSettingsRadioButton(props: RadioProps) {
  const { getInputProps, getRadioProps } = useRadio(props);

  return (
    <Button
      as="label"
      variant="unstyled"
      display="flex"
      maxHeight="auto"
      height="auto"
      cursor="pointer"
      gridArea={props.value}
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      fontWeight={500}
      _checked={{
        borderColor: "primary.500",
        backgroundColor: "primary.50",
      }}
      _hover={{
        backgroundColor: "primary.50",
      }}
      flex="1"
      padding={4}
      paddingY={3}
      {...getRadioProps()}
    >
      <input {...getInputProps()} />
      <Stack flex="1" align="center" justify="center" spacing={3}>
        {props.children}
      </Stack>
    </Button>
  );
}
