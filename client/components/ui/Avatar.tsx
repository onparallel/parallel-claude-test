/* eslint-disable no-restricted-imports */
import {
  AvatarBadge,
  AvatarBadgeProps,
  AvatarGroup,
  AvatarGroupProps,
  AvatarProps,
  Avatar as ChakraAvatar,
} from "@chakra-ui/react";
import { forwardRef, ReactElement, ReactNode } from "react";

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

export const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>((props, ref) => {
  // This component doesn't render anything visible in v2 compatibility mode
  // The props are extracted by AvatarRoot
  return null;
});

// Avatar.Fallback component - in v3 this handles fallback content
interface AvatarFallbackProps {
  name?: string;
  children?: ReactNode;
  [key: string]: any;
}

export const AvatarFallback = forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ name, children, ...props }, ref) => {
    // This component doesn't render anything visible in v2 compatibility mode
    // The props are extracted by AvatarRoot
    return null;
  },
);

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

export const AvatarRoot = forwardRef<HTMLSpanElement, AvatarRootProps>(
  ({ colorPalette, size, variant, shape, borderless, onStatusChange, children, ...props }, ref) => {
    // Extract src and name from children
    let extractedSrc: string | undefined;
    let extractedName: string | undefined;

    // Look for Avatar.Image and Avatar.Fallback in children
    const processChild = (child: ReactElement) => {
      if (child?.type === AvatarImage) {
        extractedSrc = (child.props as AvatarImageProps).src;
      }
      if (child?.type === AvatarFallback) {
        extractedName = (child.props as AvatarFallbackProps).name;
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
          ? children.filter(
              (child) => child?.type !== AvatarImage && child?.type !== AvatarFallback,
            )
          : (children as ReactElement)?.type !== AvatarImage &&
              (children as ReactElement)?.type !== AvatarFallback
            ? children
            : null}
      </ChakraAvatar>
    );
  },
);

// AvatarBadge component - maps to v2 AvatarBadge
export const AvatarBadgeWrapper = forwardRef<HTMLDivElement, AvatarBadgeProps>((props, ref) => {
  return <AvatarBadge ref={ref} {...props} />;
});

// v3 API only - AvatarGroup props
interface AvatarGroupWrapperProps extends Omit<AvatarGroupProps, "spacing"> {
  gap?: string | number;
  spaceX?: string | number;
  borderless?: boolean;
  stacking?: "first-on-top" | "last-on-top";
}

export const AvatarGroupWrapper = forwardRef<HTMLDivElement, AvatarGroupWrapperProps>(
  ({ gap, spaceX, borderless, stacking, ...props }, ref) => {
    return <AvatarGroup ref={ref} spacing={spaceX || gap} {...props} />;
  },
);

// Namespace for using as Avatar.XXX (without Group)
export const Avatar = {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
  Badge: AvatarBadgeWrapper,
};

// Export AvatarGroup as separate component to match v3 API
export { AvatarGroupWrapper as AvatarGroup };

// Assign display names for debugging
AvatarRoot.displayName = "Avatar.Root";
AvatarImage.displayName = "Avatar.Image";
AvatarFallback.displayName = "Avatar.Fallback";
AvatarBadgeWrapper.displayName = "Avatar.Badge";
AvatarGroupWrapper.displayName = "AvatarGroup";
