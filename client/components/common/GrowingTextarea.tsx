import { Textarea, TextareaProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import autosize from "autosize";
import { useEffect, useRef } from "react";

export const GrowingTextarea = chakraForwardRef<"textarea", TextareaProps>(
  function GrowingTextarea(props, outerRef) {
    const ref = useRef<HTMLTextAreaElement>(null);
    const _ref = useMergeRefs(outerRef, ref);
    useEffect(() => {
      autosize(ref.current!);
      return () => {
        autosize.destroy(ref.current!);
      };
    }, []);
    return <Textarea transition="height none" ref={_ref} {...props} />;
  },
);
