/**
 * A draggable divider between resizable columns.
 * Mimics the native macOS NSSplitView divider appearance and behavior.
 */
export default function ResizeHandle({
  onMouseDown,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="w-[5px] shrink-0 cursor-col-resize"
      onMouseDown={onMouseDown}
    />
  );
}
