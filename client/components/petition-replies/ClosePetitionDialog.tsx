import {
  Box,
  Button,
  Flex,
  Radio,
  RadioGroup,
  Stack,
  Text,
  useTheme,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@parallel/chakra/icons";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";

type ClosePetitionDialogAction = "APPROVE" | "REJECT";

export function ClosePetitionDialog(
  props: DialogProps<{}, ClosePetitionDialogAction>
) {
  const [value, setValue] = useState<ClosePetitionDialogAction>();

  // "hack" style config so that buttons con be full width
  const theme = useTheme();
  const radioStyleConfig = {
    ...theme.components.Radio,
    baseStyle: (props: any) => {
      const fromTheme = theme.components.Radio.baseStyle(props);
      return {
        ...fromTheme,
        label: {
          ...fromTheme.label,
          flex: 1,
        },
      };
    },
  };
  return (
    <ConfirmDialog
      closeOnOverlayClick={false}
      header={
        <FormattedMessage
          id="petition-replies.close-petition.dialog-heading"
          defaultMessage="There are some unreviewed replies"
        />
      }
      body={
        <Box>
          <Text marginBottom={4}>
            <FormattedMessage
              id="petition-replies.close-petition.dialog-subheading"
              defaultMessage="What would you like to do with them?"
            />
          </Text>
          <RadioGroup onChange={setValue as any} value={value}>
            <Stack>
              <Radio value="APPROVE" size="lg" styleConfig={radioStyleConfig}>
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
                    id="petition-replies.close-petition.dialog-approve"
                    defaultMessage="Approve unreviewed replies"
                  />
                </Button>
              </Radio>
              <Radio value="REJECT" size="lg" styleConfig={radioStyleConfig}>
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
                    id="petition-replies.close-petition.dialog-reject"
                    defaultMessage="Reject unreviewed replies"
                  />
                </Button>
              </Radio>
            </Stack>
          </RadioGroup>
        </Box>
      }
      confirm={
        <Button
          colorScheme="purple"
          isDisabled={!value}
          onClick={() => props.onResolve(value)}
        >
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useClosePetitionDialog() {
  return useDialog(ClosePetitionDialog);
}
