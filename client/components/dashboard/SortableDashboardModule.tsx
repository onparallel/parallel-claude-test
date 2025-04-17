import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DashboardModule, DashboardModuleProps } from "./DashboardModule";

interface SortableDashboardModuleProps extends DashboardModuleProps {
  id: string;
}

export function SortableDashboardModule({ id, ...props }: SortableDashboardModuleProps) {
  const { isDragging, attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined,
  };

  return (
    <DashboardModule
      ref={setNodeRef}
      style={style}
      {...props}
      attributes={attributes}
      listeners={listeners}
      isDragging={isDragging}
    />
  );
}
