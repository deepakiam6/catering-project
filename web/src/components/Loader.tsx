import { useLoading } from "../context/LoadingContext";

const Loader = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        background: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(2px)",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "3px solid rgba(5, 150, 105, 0.18)",
            borderTopColor: "#059669",
            animation: "global-loader-spin 0.8s linear infinite",
          }}
        />
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: "#374151",
          }}
        >
        </p>
      </div>

      <style>{`
        @keyframes global-loader-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
