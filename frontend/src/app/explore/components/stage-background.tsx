type StageBackgroundProps = {
    bottomOffset: number;
  };
  
  /**
   * Dark-mode arena background.
   * Keeps the stage readable while giving the scene more depth and contrast.
   */
  export function StageBackground({ bottomOffset }: StageBackgroundProps) {
    return (
      <>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(37,99,235,0.20),transparent_24%),radial-gradient(circle_at_78%_22%,rgba(124,58,237,0.18),transparent_28%),linear-gradient(to_bottom,#06111f_0%,#0a1324_36%,#0d172b_65%,#111827_100%)]" />
  
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(148,163,184,0.11) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
  
        <div
          className="absolute left-0 right-0"
          style={{
            bottom: `${bottomOffset + 26}px`,
            top: "18%",
          }}
        >
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="absolute left-10 right-10 border-t border-dashed border-white/10"
              style={{ top: `${index * 20}%` }}
            />
          ))}
        </div>
  
        <div
          className="absolute left-0 right-0 rounded-t-[56px] border-t border-white/8 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]"
          style={{
            bottom: `${bottomOffset + 8}px`,
            height: "26%",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        />
  
        <div
          className="absolute left-10 right-10 rounded-full"
          style={{
            bottom: `${bottomOffset + 20}px`,
            height: "16px",
            background:
              "linear-gradient(90deg, rgba(59,130,246,0.16), rgba(139,92,246,0.16))",
            filter: "blur(1px)",
          }}
        />
  
        <div
          className="absolute inset-x-0 top-0 h-32"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.04), transparent)",
          }}
        />
      </>
    );
  }
  