import { ButtonProps } from "@chakra-ui/react";
import { Button } from "@parallel/components/ui";
import { chakraComponent } from "@parallel/chakra/utils";
import { FileIcon } from "./FileIcon";
import { FileName } from "./FileName";

export interface SimpleFileButtonProps extends ButtonProps {
  filename: string;
  contentType: string;
}

export const SimpleFileButton = chakraComponent<"button", SimpleFileButtonProps>(
  function SimpleFileButton({ ref, filename, contentType, ...props }) {
    return (
      <Button
        ref={ref}
        size="sm"
        variant="outline"
        backgroundColor="white"
        alignItems="center"
        height="auto"
        paddingX={2}
        paddingY={1}
        {...props}
      >
        <FileIcon boxSize="18px" filename={filename} contentType={contentType} marginEnd={2} />
        <FileName value={filename} fontSize="sm" fontWeight="500" maxWidth="200px" />
      </Button>
    );
  },
);
