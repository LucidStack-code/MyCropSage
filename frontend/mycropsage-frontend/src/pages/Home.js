import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// 🧭 Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ✅ Translation helper
async function translateText(text, fromLang, toLang) {
  if (fromLang === toLang) return text;
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=${fromLang}|${toLang}`
    );
    const data = await res.json();
    return data.responseData.translatedText || text;
  } catch (err) {
    console.error("Translation error:", err);
    return text;
  }
}

// 🗣️ Text-to-Speech helper
function speakText(text, lang) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang =
    lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// 🌍 Force map to resize properly
function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 500);
  }, [map]);
  return null;
}

// ⌨️ Typewriter effect
const Typewriter = ({ text }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed((prev) => prev + text.charAt(i));
        i++;
      } else clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [text]);
  return <p>{displayed}</p>;
};

const Home = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [stores, setStores] = useState([]);
  const [coords, setCoords] = useState(null);
  const [listening, setListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const mapRef = useRef();

  // 🎙 Voice setup
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  // 📍 Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoords(position);
        setTimeout(() => {
          if (mapRef.current) mapRef.current.invalidateSize();
        }, 800);
      },
      () => setCoords({ lat: 20.5937, lng: 78.9629 })
    );
  }, []);

  // 🎤 Voice input
  const startListening = () => {
    if (!recognition) return alert("Voice recognition not supported.");
    recognition.lang =
      selectedLang === "hi"
        ? "hi-IN"
        : selectedLang === "mr"
        ? "mr-IN"
        : "en-IN";
    setListening(true);
    recognition.start();
    recognition.onresult = (event) => {
      setQuery(event.results[0][0].transcript);
      setListening(false);
    };
  };

  // 🔍 Analyze
  const handleSubmit = async () => {
    if (!query.trim()) return alert("Please enter or speak your query!");
    setLoading(true);
    setResult(null);

    try {
      const translatedQuery = await translateText(query, selectedLang, "en");
      const res = await axios.post("http://127.0.0.1:8000/api/classify/", {
        query: translatedQuery,
      });

      let output = res.data;
      if (selectedLang !== "en") {
        output.issue = await translateText(output.issue, "en", selectedLang);
        const translatedRemedies = await Promise.all(
          output.details.remedies.map((r) =>
            translateText(r, "en", selectedLang)
          )
        );
        output.details.remedies = translatedRemedies;
      }

      setResult(output);

      const resp = await axios.get(
        `http://127.0.0.1:8000/api/nearby_stores/?lat=${coords.lat}&lng=${coords.lng}&radius=5`
      );
      setStores(resp.data.stores || []);

      const remediesText = output.details?.remedies?.join(", ");
      const speechText =
        selectedLang === "hi"
          ? `समस्या है ${output.issue}. उपाय हैं: ${remediesText}`
          : selectedLang === "mr"
          ? `समस्या आहे ${output.issue}. उपाय आहेत: ${remediesText}`
          : `The detected issue is ${output.issue}. Remedies are: ${remediesText}`;
      speakText(speechText, selectedLang);
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  // 🌈 Updated UI
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #a8e6cf, #dcedc1, #ffd3b6, #ffaaa5)",
        backgroundSize: "400% 400%",
        animation: "bgMove 12s ease infinite",
        color: "#222",
        fontFamily: "Poppins, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "50px 20px",
      }}
    >
      <style>
        {`
          @keyframes bgMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          ::placeholder { color: #777; }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* 🌾 Hero Section */}
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: "700",
            color: "#023e8a",
            marginBottom: "10px",
          }}
        >
          🌿 MyCropSage
        </h1>
        <p style={{ fontSize: "1.3rem", opacity: 0.8, color: "#023e8a" }}>
          Your AI-Powered Multilingual Crop Diagnosis Assistant
        </p>
      </div>

      {/* 🔄 Loading Overlay */}
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,255,255,0.8)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#1d3557",
            fontWeight: "600",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            style={{
              border: "6px solid #eee",
              borderTop: "6px solid #023e8a",
              borderRadius: "50%",
              width: "60px",
              height: "60px",
              animation: "spin 1s linear infinite",
              marginBottom: "20px",
            }}
          />
          <p>Analyzing your input...</p>
          <p>Detecting issue and nearby stores...</p>
        </div>
      )}

      {/* 💬 Input + Output */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          width: "100%",
          maxWidth: "1200px",
          marginBottom: "40px",
        }}
      >
        {/* Left Card */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.6)",
            borderRadius: "20px",
            padding: "30px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          <h2 style={{ color: "#023e8a", marginBottom: "10px" }}>
            🌾 Describe Your Crop Problem
          </h2>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontWeight: 600, color: "#333" }}>
              🌐 Select Language:
            </label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              style={{
                marginLeft: "10px",
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                fontWeight: "500",
              }}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
            </select>
          </div>

          <textarea
            placeholder="Describe your crop problem..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              height: "120px",
              marginTop: "10px",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #ccc",
              fontSize: "1rem",
              outline: "none",
            }}
          />

          <div style={{ marginTop: "20px", display: "flex", gap: "15px" }}>
            <button
              onClick={startListening}
              style={{
                flex: 1,
                padding: "12px",
                background: listening ? "#e63946" : "#06d6a0",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "600",
              }}
            >
              {listening ? "🎙 Listening..." : "🎤 Speak"}
            </button>
            <button
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: "12px",
                background: "#023e8a",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "600",
              }}
            >
              🔍 Analyze
            </button>
          </div>
        </div>

        {/* Right Card */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.6)",
            borderRadius: "20px",
            padding: "30px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          {result ? (
            <>
              <h2 style={{ color: "#0077b6" }}>🧠 Detected Issue</h2>
              <p
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "500",
                  color: "#1d3557",
                  marginBottom: "10px",
                }}
              >
                <Typewriter text={result.issue} />
              </p>

              <h3 style={{ color: "#2a9d8f", marginTop: "20px" }}>
                💊 Remedies
              </h3>
              <ul style={{ paddingLeft: "20px", color: "#333" }}>
                {result.details?.remedies?.map((r, i) => (
                  <li key={i} style={{ marginBottom: "8px" }}>
                    <Typewriter text={r} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={{ color: "#555", fontStyle: "italic" }}>
              👈 Speak or type your problem to analyze it.
            </p>
          )}
        </div>
      </div>

      {/* 🗺️ Map Section */}
      {coords && (
        <div
          style={{
            width: "100%",
            maxWidth: "1000px",
            background: "rgba(255, 255, 255, 0.6)",
            borderRadius: "20px",
            padding: "20px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          <h3 style={{ color: "#d62828", marginBottom: "10px" }}>
            📍 Nearby Agro-Stores
          </h3>
          <MapContainer
            center={coords}
            zoom={13}
            scrollWheelZoom={false}
            style={{
              width: "100%",
              height: "350px",
              borderRadius: "15px",
            }}
            whenCreated={(mapInstance) => {
              mapRef.current = mapInstance;
              setTimeout(() => mapInstance.invalidateSize(), 800);
            }}
          >
            <ResizeMap />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={coords}>
              <Popup>You are here</Popup>
            </Marker>
            {stores.map((store, i) => (
              <Marker key={i} position={{ lat: store.lat, lng: store.lng }}>
                <Popup>
                  <b>{store.name}</b>
                  <br />
                  {store.address}
                  <br />
                  📞 {store.phone}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default Home;
