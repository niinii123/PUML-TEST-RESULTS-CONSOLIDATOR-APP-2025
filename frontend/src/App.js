import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
   const [authenticated, setAuthenticated] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const correctKey = "2025@Met@L@b"; // secure pass key

  // ✅ Check local storage for existing authentication
  useEffect(() => {
    const isAuth = localStorage.getItem("authenticated");
    if (isAuth === "true") setAuthenticated(true);
    fetchData();
    fetchCount();
  }, []);

  const handleAuth = () => {
    if (inputKey === correctKey) {
      setAuthenticated(true);
      localStorage.setItem("authenticated", "true");
    } else {
      alert("Invalid access key. Please try again.");
    }
  };

  const logout = () => {
    localStorage.removeItem("authenticated");
    setAuthenticated(false);
    setInputKey("");
  };



  const [files, setFiles] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);


  // Fetch all data on load
  useEffect(() => {
    fetchData();
    fetchCount();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/data");
      setData(res.data);
      setFilteredData(res.data);
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };

  const fetchCount = async () => {
    const res = await fetch("http://localhost:5000/count");
    const json = await res.json();
    setTotalCount(json.total);
  };

  const handleUpload = async () => {
    if (files.length === 0) return alert("Please select Excel files first");
    const formData = new FormData();
    for (const file of files) formData.append("files", file);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/upload-multiple", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchData(); // refresh view from DB
      await fetchCount(); // fetch the total rows from the DB and posts it as total on the frontend
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete all consolidated data?")) return;
    try {
      await axios.delete("http://localhost:5000/delete-all");
      setData([]);
      setFilteredData([]);
      alert("All data deleted successfully!");
      setTotalCount(0);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete data");
    }
  };

  // 🔍 Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredData(data);
      return;
    }

    const result = data.filter((row) => {
      const indexNumber = String(row[1] || "").toLowerCase();
      return indexNumber.includes(term.toLowerCase());
    });
    setFilteredData(result);
  };

  // 🎯 Handle filter by text (checks all columns)
  const handleFilter = (term) => {
    setFilterTerm(term);
    if (!term) {
      setFilteredData(data);
      return;
    }

    const result = data.filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredData(result);
  };

  const handleExportFiltered = async () => {
  if (!filteredData.length) {
    alert("No filtered data available to export");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/export-filtered", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: filteredData }),
    });

    if (!res.ok) throw new Error("Failed to export file");

    // Convert the response to a downloadable file
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Filtered_Results.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Failed to export filtered data");
  }
};



  // 🧩 Authentication screen (before access)
  if (!authenticated) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundImage: "url('/lab1.jpg')",
          backgroundSize: "cover", //ensure the b
          fontFamily: "Segoe UI, sans-serif",
        }}
      >
        <h2 style={{ color: "#333", marginBottom: 20 }}>Secure Access Required</h2>
        <input
          type="password"
          placeholder="Enter Access Key"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            width: "250px",
            marginBottom: "15px",
            textAlign: "center",
          }}
        />
        <button
          onClick={handleAuth}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
          }}
        >
          Access System
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f4f6f8",
        fontFamily: "Segoe UI, sans-serif",
        paddingBottom: "40px",
      }}
    >
      <h2 style={{ color: "#333", marginBottom: 20, textAlign: "center" }}>
        📊 Meter Test Results Consolidator
      </h2>

       <button
        onClick={logout}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          padding: "8px 16px",
          backgroundColor: "#e74c3c",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>

      {/* ✅ Total count display */}
      <h3>
        Total Tested Meters: {totalCount} 
      </h3>


      <div
        style={{
          border: "2px dashed #999",
          padding: 40,
          width: "60%",
          maxWidth: 600,
          borderRadius: 10,
          background: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <input
          type="file"
          multiple
          accept=".xlsx, .xls"
          onChange={(e) => setFiles([...e.target.files])}
          style={{
            marginBottom: 20,
            width: "100%",
            cursor: "pointer",
            padding: "10px",
            paddingLeft: "210px"
          }}
        />

        <div>
          <button
            onClick={handleUpload}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              marginRight: 10,
            }}
          >
            {loading ? "Uploading..." : "Upload All"}
          </button>

          <button
            onClick={handleDeleteAll}
            style={{
              padding: "10px 20px",
              backgroundColor: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
            }}
          >
            Delete All
          </button>
          <button
             onClick={() => window.open("http://localhost:5000/export")}
             style={{
             background: "#0000FF",
             color: "white",
             border: "none",
             padding: "10px 18px",
             borderRadius: "6px",
             cursor: "pointer",
             marginLeft: "12px",
           }}>
             Export All 
          </button>
          <button
            onClick={handleExportFiltered}
            style={{
            padding: "10px 20px",
            backgroundColor: "#000000",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginTop: "10px",
            marginLeft: "10px"
         }}
         >
          Export Filtered 
        </button>


        </div>
      </div>

      {/* 🔍 Search and Filter Section */}
      <div
        style={{
          marginTop: 30,
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          width: "80%",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search by Index Number"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            padding: "10px",
            width: "250px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        <input
          type="text"
          placeholder="Filter (any text)"
          value={filterTerm}
          onChange={(e) => handleFilter(e.target.value)}
          style={{
            padding: "10px",
            width: "250px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
      </div>

    {/* 🧾 Table Section */}
<div
  style={{
    marginTop: 40,
    width: "100%",
    display: "flex",
    justifyContent: "center",
  }}
>
  <div
    style={{
      width: "95%",
      maxWidth: "1400px",
      overflowX: "auto", // allows scrolling only if absolutely needed
      background: "#fff",
      borderRadius: "8px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      padding: "4px 8px",
    }}
  >
    {filteredData.length > 0 ? (
      <table
        border="1"
        cellPadding="5"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "auto", // adjusts cell width to fit
          textAlign: "center",
        }}
      >
        <tbody>

          {filteredData.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "6px 9px",
                    border: "1px solid #ccc",
                    wordWrap: "break-word",
                    maxWidth: "185px",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p
        style={{
          color: "#777",
          fontStyle: "italic",
          textAlign: "center",
          width: "100%",
        }}
      >
        No data found. Try searching or filtering differently.
      </p>
    )}
  </div>
</div>

    </div>
  );
}

export default App;

 