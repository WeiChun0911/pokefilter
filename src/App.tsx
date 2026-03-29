import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"none" | "include" | "exclude">("none");

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

  // Include: 中文名稱,中文名稱,...
  const includeText = text;
  // Exclude: !中文名稱&!中文名稱&...
  const excludeText = text
    .split(",")
    .map((name) => `!${name}`)
    .join("&");

  const handleCopy = async (type: "include" | "exclude") => {
    const content = type === "include" ? includeText : excludeText;
    await navigator.clipboard.writeText(content);
    setCopied(type);
    setTimeout(() => setCopied("none"), 2000);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Pokemon PvP Name List</h1>
      <button onClick={() => handleCopy("include")}>
        {copied === "include" ? "Copied!" : "Copy Include"}
      </button>
      {updatedAt && (
        <p style={{ fontSize: "14px", color: "#888", marginTop: "8px" }}>
          Data updated: {new Date(updatedAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}
        </p>
      )}
      <p style={{ marginTop: "16px", lineHeight: 1.8, wordBreak: "break-all" }}>
        {text}
      </p>

      <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #ccc" }} />

      <button onClick={() => handleCopy("exclude")}>
        {copied === "exclude" ? "Copied!" : "Copy Exclude"}
      </button>
      <p style={{ marginTop: "16px", lineHeight: 1.8, wordBreak: "break-all" }}>
        {excludeText}
      </p>
    </div>
  );
}

export default App;
