"use client";

import { useEffect, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { ResizeState } from "../types";
import { clamp } from "../lib/arena-math";

type UseResizableDockArgs = {
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
};

export function useResizableDock({
  defaultWidth = 860,
  defaultHeight = 156,
  minWidth = 360,
  maxWidth = 1100,
  minHeight = 120,
  maxHeight = 280,
}: UseResizableDockArgs = {}) {
  const [size, setSize] = useState({
    width: defaultWidth,
    height: defaultHeight,
  });

  const [resizeState, setResizeState] = useState<ResizeState>(null);

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      if (!resizeState) return;

      const nextWidth = clamp(
        resizeState.startWidth + (event.clientX - resizeState.startX),
        minWidth,
        Math.min(window.innerWidth - 32, maxWidth)
      );

      const nextHeight = clamp(
        resizeState.startHeight + (event.clientY - resizeState.startY),
        minHeight,
        maxHeight
      );

      setSize({
        width: nextWidth,
        height: nextHeight,
      });
    }

    function handleMouseUp() {
      setResizeState(null);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizeState, minWidth, maxWidth, minHeight, maxHeight]);

  function handleResizeStart(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    setResizeState({
      startX: event.clientX,
      startY: event.clientY,
      startWidth: size.width,
      startHeight: size.height,
    });
  }

  return {
    size,
    resizeState,
    handleResizeStart,
  };
}
