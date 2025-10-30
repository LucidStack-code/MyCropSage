import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav
      style={{
        background: "#1d3557",
        color: "white",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h2>🌾 MyCropSage</h2>
      <div>
        <Link to="/" style={linkStyle}>Home</Link>
        <Link to="/admin" style={linkStyle}>Admin</Link>
      </div>
    </nav>
  );
};

const linkStyle = {
  color: "white",
  textDecoration: "none",
  margin: "0 12px",
  fontWeight: "bold",
};

export default Navbar;
