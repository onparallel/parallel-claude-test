import { Box, BoxProps, Flex } from "@chakra-ui/react";

export interface ProgressIndicatorProps extends BoxProps {
  min: number;
  max: number;
  value: number;
}

export function ProgressIndicator({
  min,
  max,
  value,
  ...rest
}: ProgressIndicatorProps) {
  const percent = valueToPercent(value, min, max);
  return (
    <Box height="100%" transition="all 300ms" width={percent + "%"} {...rest} />
  );
}

const progressbarSizes = {
  lg: "1rem",
  md: "0.75rem",
  sm: "0.5rem",
};

export interface ProgressTrackProps extends Omit<BoxProps, "size"> {
  size: keyof typeof progressbarSizes;
  min: number;
  max: number;
  value: number;
}

export function ProgressTrack({
  size,
  min,
  max,
  value,
  ...rest
}: ProgressTrackProps) {
  return (
    <Flex
      height={progressbarSizes[size]}
      aria-valuemax={max}
      aria-valuemin={min}
      aria-valuenow={value}
      role="progressbar"
      overflow="hidden"
      borderRadius={progressbarSizes[size]}
      backgroundColor="gray.200"
      {...rest}
    />
  );
}

function valueToPercent(value: number, min: number, max: number) {
  return ((value - min) * 100) / (max - min);
}
