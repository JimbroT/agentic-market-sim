export type PortfolioEntity = {
    id: string;
    label: string;
    color: string;
    accent: string;
    startingBalance: number;
    roundValues: number[];
    avatarUrl?: string;
  };  
  
  export type RankedEntity = PortfolioEntity & {
    currentValue: number;
    rank: number;
  };
  
  export type DragState = {
    offsetX: number;
    offsetY: number;
  } | null;
  
  export type ResizeState = {
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null;
  