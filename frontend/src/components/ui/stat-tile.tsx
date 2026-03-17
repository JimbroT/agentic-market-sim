type StatTileProps = {
    label: string;
    value: string | number;
  };
  
  export function StatTile({ label, value }: StatTileProps) {
    return (
      <div className="rounded-2xl bg-[#f5f7fb] px-4 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#7c8797]">
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold text-[#111827]">{value}</p>
      </div>
    );
  }
  