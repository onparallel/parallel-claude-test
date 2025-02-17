import { HStack } from "@chakra-ui/react";
import { downloadLocalFile } from "@parallel/utils/downloadLocalFile";
import { FileAttachment } from "./FileAttachment";

interface LocalFileAttachmentsProps {
  files: File[];
  onRemoveFile: (file: File) => void;
}

export function LocalFileAttachments({ files, onRemoveFile }: LocalFileAttachmentsProps) {
  const handleDownload = (file: File) => {
    downloadLocalFile(file);
  };
  return (
    <HStack flexWrap="wrap">
      {files.map((file, index) => {
        return (
          <FileAttachment
            key={index}
            filename={file.name}
            contentType={file.type}
            size={file.size}
            isComplete={true}
            isDisabled={false}
            onDownload={() => handleDownload(file)}
            onRemove={() => onRemoveFile(file)}
          />
        );
      })}
    </HStack>
  );
}
