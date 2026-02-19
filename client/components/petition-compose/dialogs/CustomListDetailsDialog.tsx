import { ListItem, UnorderedList } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ScrollShadows } from "@parallel/components/common/ScrollShadows";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";
import { Button, Stack, Text } from "@parallel/components/ui";

function CustomListDetailsDialog({
  customList,
  ...props
}: DialogProps<{ customList: { name: string; values: string[] } }>) {
  const { name, values } = customList;
  const focusRef = useRef<HTMLButtonElement>(null);
  return (
    <ConfirmDialog
      size="lg"
      scrollBehavior="inside"
      initialFocusRef={focusRef}
      header={name}
      body={
        <ScrollShadows as={Stack}>
          <Text>
            <FormattedMessage
              id="component.custom-list-details.options-included"
              defaultMessage="Options included:"
            />
          </Text>
          <UnorderedList paddingStart={3}>
            {values.map((value, i) => {
              return <ListItem key={i}>{value}</ListItem>;
            })}
          </UnorderedList>
        </ScrollShadows>
      }
      cancel={<></>}
      confirm={
        <Button ref={focusRef} onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
      {...props}
    />
  );
}

export function useCustomListDetailsDialog() {
  return useDialog(CustomListDetailsDialog);
}
