/**
 * Utility functions used across the explore arena UI.
 *
 * Purpose:
 * - Keep shared helpers (classnames, clamping, layout-related constants) in one
 *   place to avoid duplicating subtle UI math across components and hooks.
 *
 * Design note:
 * - This module is dependency-free to avoid circular imports in `explore/`.
 */
/**
 * Small shared utilities for the explore arena.
 *
 * This file intentionally stays tiny and dependency-free so components/hooks
 * can import it freely without causing circular dependencies.
 */
export function cn(...values: Array<string | false | null | undefined>) {
    return values.filter(Boolean).join(" ");
  }
  
  /**
   * Clamp a numeric value into a min/max range.
   */
  export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }
  
  /**
   * The timeline dock consumes canvas space when open.
   * We reserve vertical room so podiums never collide with it.
   */
  export function getTimelineReservedSpace(isOpen: boolean, height: number) {
    return isOpen ? height + 24 : 76;
  }
  