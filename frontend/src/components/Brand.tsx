import { AudioLines } from "lucide-react";
import { Link } from "react-router-dom";

export function Brand({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="brand" aria-label="Mockmate home">
      <span className="brand-mark"><AudioLines size={20} strokeWidth={2.5} /></span>
      <span>mockmate</span>
    </Link>
  );
}

