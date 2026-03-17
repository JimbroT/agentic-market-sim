/**
 * Small utility for joining conditional class names.
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
  