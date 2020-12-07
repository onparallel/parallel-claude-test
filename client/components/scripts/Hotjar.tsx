import { memo, useEffect } from "react";
import { hotjar } from "react-hotjar";

export const Hotjar = memo(() => {
  useEffect(() => {
    hotjar.initialize(1548670, 6);
  }, []);
  return null;
});
