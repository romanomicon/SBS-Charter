const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());

// Serve static files from root, js/, css/ folders
app.use(express.static(path.join(__dirname, "..")));      // root html files
app.use("/js", express.static(path.join(__dirname, "..", "js")));
app.use("/css", express.static(path.join(__dirname, "..", "css")));

// Example route to test backend
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
