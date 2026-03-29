import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/pokemon-names.json")
      .then((res) => res.json())
      .then((data) => {
        setText(data.names);
        setUpdatedAt(data.updatedAt);
      })
      .catch(() => setText("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Pokemon PvP Name List</h1>
      <button onClick={handleCopy}>
        {copied ? "Copied!" : "Copy"}
      </button>
      {updatedAt && (
        <p style={{ fontSize: "14px", color: "#888", marginTop: "8px" }}>
          Data updated: {new Date(updatedAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}
        </p>
      )}
      <p style={{ marginTop: "16px", lineHeight: 1.8, wordBreak: "break-all" }}>
        {text}
      </p>
    </div>
  );
}

export default App;
