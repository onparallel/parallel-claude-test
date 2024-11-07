import { ListItem, Stack, Text, UnorderedList } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ScrollShadows } from "@parallel/components/common/ScrollShadows";
import { FormattedMessage } from "react-intl";

function CustomListDetailsDialog({
  customList,
  ...props
}: DialogProps<{
  customList: {
    name: string;
    values: string[];
  };
}>) {
  const { name, values } = customList;
  return (
    <ConfirmDialog
      size="lg"
      scrollBehavior="inside"
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
      confirm={<></>}
      {...props}
    />
  );
}

export function useCustomListDetailsDialog() {
  return useDialog(CustomListDetailsDialog);
}
