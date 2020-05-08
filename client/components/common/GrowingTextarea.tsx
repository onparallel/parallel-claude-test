import { InputProps, Textarea } from "@chakra-ui/core";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import autosize from "autosize";
import { forwardRef, useEffect, useRef } from "react";

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
