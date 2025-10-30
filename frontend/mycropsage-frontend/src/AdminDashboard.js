import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [problems, setProblems] = useState([]);
  const [stores, setStores] = useState([]);
  const [newProblem, setNewProblem] = useState({
    name: "",
    description: "",
    causes: "",
    remedies: "",
  });
  const [newStore, setNewStore] = useState({
    name: "",
    address: "",
    phone: "",
    lat: "",
    lng: "",
  });

  // Fetch all problems and stores
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const probRes = await axios.get("http://127.0.0.1:8000/api/problems/");
    const storeRes = await axios.get("http://127.0.0.1:8000/api/stores/");
    setProblems(probRes.data);
    setStores(storeRes.data);
  };

  const handleAddProblem = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/api/problems/", newProblem);
      alert("✅ Problem added!");
      setNewProblem({ name: "", description: "", causes: "", remedies: "" });
      fetchData();
    } catch (err) {
      alert("❌ Failed to add problem");
    }
  };

  const handleAddStore = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/api/stores/", newStore);
      alert("✅ Store added!");
      setNewStore({ name: "", address: "", phone: "", lat: "", lng: "" });
      fetchData();
    } catch (err) {
      alert("❌ Failed to add store");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "Poppins, sans-serif",
        background: "linear-gradient(to right, #FBD786, #C6FFDD)",
      }}
    >
      <h1 style={{ textAlign: "center" }}>⚙️ MyCropSage Admin Dashboard</h1>

      <section style={{ marginTop: "30px" }}>
        <h2>🌾 Add New Problem</h2>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "400px" }}>
          <input
            placeholder="Name"
            value={newProblem.name}
            onChange={(e) => setNewProblem({ ...newProblem, name: e.target.value })}
            style={{ margin: "5px", padding: "8px" }}
          />
          <textarea
            placeholder="Description"
            value={newProblem.description}
            onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
            style={{ margin: "5px", padding: "8px" }}
          />
          <input
            placeholder="Causes (comma separated)"
            value={newProblem.causes}
            onChange={(e) => setNewProblem({ ...newProblem, causes: e.target.value })}
            style={{ margin: "5px", padding: "8px" }}
          />
          <input
            placeholder="Remedies (comma separated)"
            value={newProblem.remedies}
            onChange={(e) => setNewProblem({ ...newProblem, remedies: e.target.value })}
            style={{ margin: "5px", padding: "8px" }}
          />
          <button
            onClick={handleAddProblem}
            style={{
              margin: "10px",
              padding: "10px",
              background: "#2a9d8f",
              color: "white",
              border: "none",
              borderRadius: "8px",
            }}
          >
            ➕ Add Problem
          </button>
        </div>
      </section>

      <section style={{ marginTop: "40px" }}>
        <h2>🏪 Add New Store</h2>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "400px" }}>
          <input
            placeholder="Name"
            value={newStore.name}
            onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
            style={{ margin: "5px", padding: "8px" }}
          />
          <input
            placeholder="Address"
            value={newStore.address}
            onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
            style={{ margin: "5px", padding: "8px" }}
          />
          <input
            placeholder="Phone"
            value={newStore.phone}
            onChange={(e) => setNewStore({ ...newStore, phone: e.target.value })}
            style={{ margin: "5px", padding: "8px" }}
          />
          <input
            placeholder="Latitude"
            value={newStore.lat}
            onChange={(e) => setNewStore({ ...newStore, lat: e.target.value })}
            style={{ margin: "5px", padding: "8px" }}
          />
          <input
            placeholder="Longitude"
            value={newStore.lng}
            onChange={(e) => setNewStore({ ...newStore, lng: e.target.value })}
            style={{ margin: "5px", padding: "8px" }}
          />
          <button
            onClick={handleAddStore}
            style={{
              margin: "10px",
              padding: "10px",
              background: "#1d3557",
              color: "white",
              border: "none",
              borderRadius: "8px",
            }}
          >
            ➕ Add Store
          </button>
        </div>
      </section>

      <section style={{ marginTop: "40px" }}>
        <h2>📋 Existing Problems</h2>
        <ul>
          {problems.map((p) => (
            <li key={p.id}>
              <b>{p.name}</b> — {p.description}
            </li>
          ))}
        </ul>

        <h2 style={{ marginTop: "30px" }}>📍 Existing Stores</h2>
        <ul>
          {stores.map((s) => (
            <li key={s.id}>
              <b>{s.name}</b> — {s.address} ({s.lat}, {s.lng})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AdminDashboard;
