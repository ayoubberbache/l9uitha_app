import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("l9uitha.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT CHECK(type IN ('lost', 'found')),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    location TEXT,
    date TEXT,
    contact_info TEXT,
    status TEXT DEFAULT 'active',
    image_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add user_id to items if it doesn't exist (for existing databases)
try {
  db.prepare("SELECT user_id FROM items LIMIT 1").get();
} catch (e) {
  console.log("Migrating database: adding user_id to items");
  db.exec("ALTER TABLE items ADD COLUMN user_id INTEGER REFERENCES users(id)");
}

// Migration: Add image_data to items if it doesn't exist
try {
  db.prepare("SELECT image_data FROM items LIMIT 1").get();
} catch (e) {
  console.log("Migrating database: adding image_data to items");
  db.exec("ALTER TABLE items ADD COLUMN image_data TEXT");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Auth Routes
  app.post("/api/register", (req, res) => {
    const { email, password } = req.body;
    if (!email.endsWith("hns-re2sd.dz")) {
      return res.status(400).json({ error: "Only @hns-re2sd.dz emails are allowed" });
    }
    try {
      const stmt = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)");
      const result = stmt.run(email, password);
      res.json({ id: result.lastInsertRowid, email });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      res.json({ id: user.id, email: user.email });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // API Routes
  app.get("/api/items", (req, res) => {
    const { type, category, q } = req.query;
    let query = "SELECT * FROM items WHERE status = 'active'";
    const params: any[] = [];

    if (type) {
      query += " AND type = ?";
      params.push(type);
    }
    if (category) {
      query += " AND category = ?";
      params.push(category);
    }
    if (q) {
      query += " AND (title LIKE ? OR description LIKE ?)";
      params.push(`%${q}%`, `%${q}%`);
    }

    query += " ORDER BY created_at DESC";
    const items = db.prepare(query).all(...params);
    res.json(items);
  });

  app.post("/api/items", (req, res) => {
    console.log("Received new item report:", req.body.title);
    const { user_id, type, title, description, category, location, date, contact_info, image_data } = req.body;
    
    if (!user_id || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO items (user_id, type, title, description, category, location, date, contact_info, image_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(user_id, type, title, description, category, location, date, contact_info, image_data);
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      console.error("Database error while posting item:", error);
      res.status(500).json({ error: "Failed to save item" });
    }
  });

  app.patch("/api/items/:id/resolve", (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    
    const item = db.prepare("SELECT user_id FROM items WHERE id = ?").get(id) as any;
    if (!item || item.user_id !== user_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    db.prepare("UPDATE items SET status = 'resolved' WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
