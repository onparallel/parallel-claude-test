import { Textarea, InputProps } from "@chakra-ui/core";
import { forwardRef, useRef, useEffect, ChangeEvent, useCallback } from "react";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import autosize from "autosize";

export const GrowingTextarea = forwardRef(function GrowingTextarea(
  { ...props }: InputProps<HTMLTextAreaElement>,
  outerRef
) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    autosize(ref.current!);
    return () => {
      autosize.destroy(ref.current!);
    };
  }, []);
  return (
    <Textarea
      transition="height none"
      ref={useMergeRefs(outerRef, ref)}
      {...props}
    />
  );
});
