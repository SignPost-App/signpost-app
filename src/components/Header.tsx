import { Link } from 'react-router-dom';

interface Props {
  onAddClick: () => void;
}

export default function Header({ onAddClick }: Props) {
  return (
    <header className="header">
      <Link to="/" className="header-brand" style={{ textDecoration: 'none' }}>
        <span className="header-logo">🗺️</span>
        <div>
          <div className="header-name">HoboSign</div>
          <div className="header-tagline">Greater Seattle Resources</div>
        </div>
      </Link>
      <div className="header-actions">
        <button className="btn btn-primary" onClick={onAddClick}>
          + Add
        </button>
        <Link to="/poster" className="btn btn-ghost">Poster</Link>
        <Link to="/admin"  className="btn btn-ghost">Admin</Link>
      </div>
    </header>
  );
}
