import React, { useState, useEffect } from "react";
import axios from "axios";

const Admin = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [problems, setProblems] = useState([]);
  const [stores, setStores] = useState([]);

  const [newProblem, setNewProblem] = useState({
    name: "",
    description: "",
    causes: "",
    remedies: "",
  });
  const [editingProblem, setEditingProblem] = useState(null);

  const [newStore, setNewStore] = useState({
    name: "",
    address: "",
    phone: "",
    lat: "",
    lng: "",
  });
  const [editingStore, setEditingStore] = useState(null);

  // Auto login if token exists
  useEffect(() => {
    if (token) {
      setLoggedIn(true);
      fetchData();
    }
  }, [token]);

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/admin_login/", {
        username,
        password,
      });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setLoggedIn(true);
      fetchData();
    } catch {
      alert("Invalid credentials");
    }
  };

  const fetchData = async () => {
    const config = { headers: { Authorization: `Token ${token}` } };
    const probRes = await axios.get("http://127.0.0.1:8000/api/problems/", config);
    const storeRes = await axios.get("http://127.0.0.1:8000/api/stores/", config);
    setProblems(probRes.data);
    setStores(storeRes.data);
  };

  // 🧩 Add or Update Problem
  const saveProblem = async () => {
    try {
      const config = { headers: { Authorization: `Token ${token}` } };

      if (editingProblem) {
        await axios.put(
          `http://127.0.0.1:8000/api/problems/${editingProblem.id}/`,
          newProblem,
          config
        );
        alert("✅ Problem updated successfully!");
        setEditingProblem(null);
      } else {
        await axios.post("http://127.0.0.1:8000/api/problems/", newProblem, config);
        alert("✅ Problem added successfully!");
      }

      setNewProblem({ name: "", description: "", causes: "", remedies: "" });
      fetchData();
    } catch {
      alert("⚠️ Error saving problem");
    }
  };

  // 🧩 Add or Update Store
  const saveStore = async () => {
    try {
      const config = { headers: { Authorization: `Token ${token}` } };

      if (editingStore) {
        await axios.put(
          `http://127.0.0.1:8000/api/stores/${editingStore.id}/`,
          newStore,
          config
        );
        alert("✅ Store updated successfully!");
        setEditingStore(null);
      } else {
        await axios.post("http://127.0.0.1:8000/api/stores/", newStore, config);
        alert("✅ Store added successfully!");
      }

      setNewStore({ name: "", address: "", phone: "", lat: "", lng: "" });
      fetchData();
    } catch {
      alert("⚠️ Error saving store");
    }
  };

  if (!loggedIn)
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>🔐 Admin Login</h2>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button onClick={handleLogin}>Login</button>
      </div>
    );

  return (
    <div style={{ padding: "20px" }}>
      <h1>⚙️ Admin Dashboard</h1>

      {/* ------------------- PROBLEMS ------------------- */}
      <h2>{editingProblem ? "✏️ Edit Problem" : "➕ Add Problem"}</h2>
      <input
        placeholder="Name"
        value={newProblem.name}
        onChange={(e) => setNewProblem({ ...newProblem, name: e.target.value })}
      />
      <input
        placeholder="Description"
        value={newProblem.description}
        onChange={(e) =>
          setNewProblem({ ...newProblem, description: e.target.value })
        }
      />
      <input
        placeholder="Causes"
        value={newProblem.causes}
        onChange={(e) => setNewProblem({ ...newProblem, causes: e.target.value })}
      />
      <input
        placeholder="Remedies"
        value={newProblem.remedies}
        onChange={(e) =>
          setNewProblem({ ...newProblem, remedies: e.target.value })
        }
      />
      <button onClick={saveProblem}>
        {editingProblem ? "💾 Update Problem" : "➕ Add Problem"}
      </button>

      <h3>📋 Existing Problems:</h3>
      <ul>
        {problems.map((p) => (
          <li key={p.id} style={{ marginBottom: "8px" }}>
            <b>{p.name}</b>
            <button
              onClick={() => {
                setEditingProblem(p);
                setNewProblem(p);
              }}
              style={{
                marginLeft: "10px",
                background: "#2a9d8f",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "4px 8px",
              }}
            >
              ✏️ Edit
            </button>
            <button
              onClick={async () => {
                if (window.confirm(`Delete problem "${p.name}"?`)) {
                  await axios.delete(
                    `http://127.0.0.1:8000/api/problems/${p.id}/`,
                    { headers: { Authorization: `Token ${token}` } }
                  );
                  fetchData();
                }
              }}
              style={{
                background: "#e63946",
                marginLeft: "10px",
                border: "none",
                color: "white",
                padding: "4px 8px",
                borderRadius: "6px",
              }}
            >
              🗑 Delete
            </button>
          </li>
        ))}
      </ul>

      <hr />

      {/* ------------------- STORES ------------------- */}
      <h2>{editingStore ? "✏️ Edit Store" : "➕ Add Store"}</h2>
      <input
        placeholder="Name"
        value={newStore.name}
        onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
      />
      <input
        placeholder="Address"
        value={newStore.address}
        onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
      />
      <input
        placeholder="Phone"
        value={newStore.phone}
        onChange={(e) => setNewStore({ ...newStore, phone: e.target.value })}
      />
      <input
        placeholder="Latitude"
        value={newStore.lat}
        onChange={(e) => setNewStore({ ...newStore, lat: e.target.value })}
      />
      <input
        placeholder="Longitude"
        value={newStore.lng}
        onChange={(e) => setNewStore({ ...newStore, lng: e.target.value })}
      />
      <button onClick={saveStore}>
        {editingStore ? "💾 Update Store" : "➕ Add Store"}
      </button>

      <h3>📍 Existing Stores:</h3>
      <ul>
        {stores.map((s) => (
          <li key={s.id} style={{ marginBottom: "8px" }}>
            <b>{s.name}</b>
            <button
              onClick={() => {
                setEditingStore(s);
                setNewStore(s);
              }}
              style={{
                marginLeft: "10px",
                background: "#2a9d8f",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "4px 8px",
              }}
            >
              ✏️ Edit
            </button>
            <button
              onClick={async () => {
                if (window.confirm(`Delete store "${s.name}"?`)) {
                  await axios.delete(
                    `http://127.0.0.1:8000/api/stores/${s.id}/`,
                    { headers: { Authorization: `Token ${token}` } }
                  );
                  fetchData();
                }
              }}
              style={{
                marginLeft: "10px",
                background: "#e63946",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "4px 8px",
              }}
            >
              🗑 Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Admin;
