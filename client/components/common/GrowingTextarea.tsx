import { Textarea, TextareaProps } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import autosize from "autosize";
import { useEffect, useRef } from "react";

export const GrowingTextarea = chakraComponent<"textarea", TextareaProps>(function GrowingTextarea({
  ref: outerRef,
  ...props
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const _ref = useMergeRefs(outerRef, ref);
  useEffect(() => {
    autosize(ref.current!);
    return () => {
      autosize.destroy(ref.current!);
    };
  }, []);
  return <Textarea transition="height none" ref={_ref} {...props} />;
});
