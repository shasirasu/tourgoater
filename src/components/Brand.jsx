import { Link } from "react-router-dom";

export default function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Tourgoater home">
      <span className="brand-mark" aria-hidden="true">
        <img src="/images/branding/tg-logo.png" alt="" width="44" height="44" />
      </span>
      <span>Tourgoater</span>
    </Link>
  );
}
