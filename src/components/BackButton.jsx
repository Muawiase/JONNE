import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ fallbackPath = "/", label = "Back", style = {} }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="back-btn"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "transparent",
        border: "none",
        color: "var(--text-secondary)",
        fontWeight: 600,
        fontSize: "14px",
        cursor: "pointer",
        padding: "6px 12px",
        borderRadius: "var(--radius-sm)",
        transition: "all 0.2s ease",
        ...style,
      }}
      aria-label={label}
    >
      <ArrowLeft size={16} />
      <span>{label}</span>
    </button>
  );
}
