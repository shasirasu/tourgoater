import { Link } from "react-router-dom";

export default function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Tourgoater home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
          <path d="m9.7 12.3 1.2-4.1 3.4-1.6-1.2 4.2-3.4 1.5Z" />
        </svg>
      </span>
      <span>Tourgoater</span>
    </Link>
  );
}
