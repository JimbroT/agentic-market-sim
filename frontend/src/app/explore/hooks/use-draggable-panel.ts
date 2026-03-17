"use client";

import { useEffect, useState } from "react";
import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import type { DragState } from "../types";
import { clamp } from "../lib/arena-math";

type UseDraggablePanelArgs = {
  containerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  reservedBottomSpace: number;
  defaultPosition?: {
    x: number;
    y: number;
  };
};

export function useDraggablePanel({
  containerRef,
  panelRef,
  reservedBottomSpace,
  defaultPosition = { x: 16, y: 100 },
}: UseDraggablePanelArgs) {
  const [position, setPosition] = useState(defaultPosition);
  const [dragState, setDragState] = useState<DragState>(null);

  /**
   * Keep the panel inside the visible canvas whenever
   * layout or dock height changes.
   */
  useEffect(() => {
    if (!containerRef.current || !panelRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const panelRect = panelRef.current.getBoundingClientRect();

    const maxX = Math.max(16, containerRect.width - panelRect.width - 16);
    const maxY = Math.max(
      16,
      containerRect.height - reservedBottomSpace - panelRect.height - 16
    );

    setPosition((previous) => ({
      x: clamp(previous.x, 16, maxX),
      y: clamp(previous.y, 16, maxY),
    }));
  }, [containerRef, panelRef, reservedBottomSpace]);

  /**
   * Global drag listeners so dragging still works
   * even when the cursor leaves the panel box.
   */
  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      if (!dragState || !containerRef.current || !panelRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const panelRect = panelRef.current.getBoundingClientRect();

      const nextX = event.clientX - containerRect.left - dragState.offsetX;
      const nextY = event.clientY - containerRect.top - dragState.offsetY;

      const maxX = Math.max(16, containerRect.width - panelRect.width - 16);
      const maxY = Math.max(
        16,
        containerRect.height - reservedBottomSpace - panelRect.height - 16
      );

      setPosition({
        x: clamp(nextX, 16, maxX),
        y: clamp(nextY, 16, maxY),
      });
    }

    function handleMouseUp() {
      setDragState(null);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, containerRef, panelRef, reservedBottomSpace]);

  function handleDragStart(event: ReactMouseEvent<HTMLDivElement>) {
    if (!panelRef.current) return;

    const panelRect = panelRef.current.getBoundingClientRect();

    setDragState({
      offsetX: event.clientX - panelRect.left,
      offsetY: event.clientY - panelRect.top,
    });
  }

  return {
    position,
    dragState,
    handleDragStart,
  };
}
