import { Textarea } from "@chakra-ui/core";
import useMergedRef from "@react-hook/merged-ref";
import autosize from "autosize";
import { forwardRef, useEffect, useRef } from "react";

export const GrowingTextarea: typeof Textarea = forwardRef(
  function GrowingTextarea(props, outerRef) {
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
        ref={useMergedRef(outerRef, ref)}
        {...props}
      />
    );
  }
);
