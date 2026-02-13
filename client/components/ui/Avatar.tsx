/* eslint-disable no-restricted-imports */
import {
  AvatarBadge,
  AvatarBadgeProps,
  AvatarGroup,
  AvatarGroupProps,
  AvatarProps,
  Avatar as ChakraAvatar,
} from "@chakra-ui/react";
import { ReactElement, ReactNode, RefAttributes } from "react";

// Docs: https://chakra-ui.com/docs/components/avatar

// Avatar.Image component - in v3 this handles image-related props
interface AvatarImageProps {
  src?: string;
  srcSet?: string;
  loading?: "eager" | "lazy";
  crossOrigin?: string;
  referrerPolicy?: string;
  onError?: () => void;
  onLoad?: () => void;
  [key: string]: any;
}

export function AvatarImage(_props: AvatarImageProps) {
  // This component doesn't render anything visible in v2 compatibility mode
  // The props are extracted by AvatarRoot
  return null;
}

// Avatar.Fallback component - in v3 this handles fallback content
interface AvatarFallbackProps {
  name?: string | null;
  children?: ReactNode;
  [key: string]: any;
}

export function AvatarFallback(_props: AvatarFallbackProps) {
  // This component doesn't render anything visible in v2 compatibility mode
  // The props are extracted by AvatarRoot
  return null;
}

// v3 API only - Root component props according to official docs
export interface AvatarRootProps
  extends Omit<AvatarProps, "src" | "name" | "showBorder" | "ignoreFallback"> {
  colorPalette?:
    | "gray"
    | "red"
    | "orange"
    | "yellow"
    | "green"
    | "teal"
    | "blue"
    | "cyan"
    | "purple"
    | "pink";
  size?: "full" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "solid" | "subtle" | "outline";
  shape?: "square" | "rounded" | "full";
  borderless?: boolean;
  onStatusChange?: (details: any) => void;
  children?: ReactNode;
}

export function AvatarRoot({
  colorPalette,
  size,
  variant,
  shape,
  borderless,
  onStatusChange,
  children,
  ref,
  ...props
}: AvatarRootProps & RefAttributes<HTMLSpanElement>) {
  // Extract src and name from children
  let extractedSrc: string | undefined;
  let extractedName: string | undefined;

  // Look for Avatar.Image and Avatar.Fallback in children
  const processChild = (child: ReactElement) => {
    if (child?.type === AvatarImage) {
      extractedSrc = (child.props as AvatarImageProps).src;
    }
    if (child?.type === AvatarFallback) {
      extractedName = (child.props as AvatarFallbackProps).name ?? undefined;
    }
  };

  if (Array.isArray(children)) {
    children.forEach(processChild);
  } else if (children && typeof children === "object") {
    processChild(children as ReactElement);
  }

  return (
    <ChakraAvatar
      ref={ref}
      src={extractedSrc}
      name={extractedName}
      size={size}
      colorScheme={colorPalette}
      showBorder={!borderless}
      {...props}
    >
      {/* Pass through any non-Avatar children (like badges) */}
      {Array.isArray(children)
        ? children.filter((child) => child?.type !== AvatarImage && child?.type !== AvatarFallback)
        : (children as ReactElement)?.type !== AvatarImage &&
            (children as ReactElement)?.type !== AvatarFallback
          ? children
          : null}
    </ChakraAvatar>
  );
}

// AvatarBadge component - maps to v2 AvatarBadge
export function AvatarBadgeWrapper({
  ref,
  ...props
}: AvatarBadgeProps & RefAttributes<HTMLDivElement>) {
  return <AvatarBadge ref={ref} {...props} />;
}

// v3 API only - AvatarGroup props
interface AvatarGroupWrapperProps extends Omit<AvatarGroupProps, "spacing"> {
  gap?: string | number;
  spaceX?: string | number;
  borderless?: boolean;
  stacking?: "first-on-top" | "last-on-top";
}

export function AvatarGroupWrapper({
  gap,
  spaceX,
  borderless,
  stacking,
  ref,
  ...props
}: AvatarGroupWrapperProps & RefAttributes<HTMLDivElement>) {
  return <AvatarGroup ref={ref} spacing={spaceX || gap} {...props} />;
}

// Namespace for using as Avatar.XXX (without Group)
export const Avatar = {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
  Badge: AvatarBadgeWrapper,
};

// Export AvatarGroup as separate component to match v3 API
export { AvatarGroupWrapper as AvatarGroup };
