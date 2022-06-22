import { Box, Button, Flex, Radio, RadioGroup, Stack, Text, useTheme } from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import deepmerge from "deepmerge";
import { useState } from "react";
import { FormattedMessage } from "react-intl";

type SolveUnreviewedRepliesDialogAction = "APPROVE" | "REJECT";

export function SolveUnreviewedRepliesDialog(
  props: DialogProps<{}, SolveUnreviewedRepliesDialogAction>
) {
  const [value, setValue] = useState<SolveUnreviewedRepliesDialogAction>();

  // "hack" style config so that buttons con be full width
  const theme = useTheme();
  const radioStyleConfig = {
    ...theme.components.Radio,
    baseStyle: (props: any) =>
      deepmerge(theme.components.Radio.baseStyle(props), {
        label: { flex: 1 },
      }),
  };
  return (
    <ConfirmDialog
      closeOnOverlayClick={false}
      header={
        <FormattedMessage
          id="component.solve-unreviewed-replies-dialog.heading"
          defaultMessage="There are some unreviewed replies"
        />
      }
      body={
        <Box as="form">
          <Text marginBottom={4}>
            <FormattedMessage
              id="component.solve-unreviewed-replies-dialog.subheading"
              defaultMessage="What would you like to do with them?"
            />
          </Text>
          <RadioGroup onChange={setValue as any} value={value}>
            <Stack>
              <Radio
                value="APPROVE"
                isChecked={value === "APPROVE"}
                size="lg"
                styleConfig={radioStyleConfig}
              >
                <Button
                  as="div"
                  width="100%"
                  justifyContent="flex-start"
                  variant="outline"
                  isActive={value === "APPROVE"}
                >
                  <Flex
                    justifyContent="center"
                    alignItems="center"
                    backgroundColor="green.500"
                    borderRadius="md"
                    boxSize={6}
                    marginRight={2}
                  >
                    <CheckIcon boxSize={4} color="white" />
                  </Flex>
                  <FormattedMessage
                    id="component.solve-unreviewed-replies-dialog.approve"
                    defaultMessage="Approve unreviewed replies"
                  />
                </Button>
              </Radio>
              <Radio
                value="REJECT"
                isChecked={value === "REJECT"}
                size="lg"
                styleConfig={radioStyleConfig}
              >
                <Button
                  as="div"
                  width="100%"
                  justifyContent="flex-start"
                  variant="outline"
                  isActive={value === "REJECT"}
                >
                  <Flex
                    justifyContent="center"
                    alignItems="center"
                    backgroundColor="red.500"
                    borderRadius="md"
                    boxSize={6}
                    marginRight={2}
                  >
                    <CloseIcon boxSize={4} color="white" />
                  </Flex>
                  <FormattedMessage
                    id="component.solve-unreviewed-replies-dialog.reject"
                    defaultMessage="Reject unreviewed replies"
                  />
                </Button>
              </Radio>
            </Stack>
          </RadioGroup>
        </Box>
      }
      confirm={
        <Button colorScheme="primary" isDisabled={!value} onClick={() => props.onResolve(value)}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useSolveUnreviewedRepliesDialog() {
  return useDialog(SolveUnreviewedRepliesDialog);
}
