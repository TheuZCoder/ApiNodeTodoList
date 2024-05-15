const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const PORT = 3000;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "api_node",
  password: "postgres",
  port: 5432,
});

pool.connect((res) => {
  res
    ? console.log("Erro ao conectar ao banco de dados!")
    : console.log("Conectado ao banco de dados com sucesso!");
});

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/users", async (req, res) => {
  try {
    const users = await pool.query("SELECT * FROM users");
    return res.json(users.rows);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post("/session", async (req, res) => {
  const { user_name, user_password } = req.body;
  let user = "";
  try {
    user = await pool.query("SELECT * FROM users WHERE user_name = ($1) ", [
      user_name,
    ]);
    console.log(user.rows[0]);
    if (!user.rows[0]) {
      user = await pool.query(
        "INSERT INTO users (user_name,user_password) VALUES ($1, $2) RETURNING *",
        [user_name, user_password]
      );
    }
    return res.status(200).json(user.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/todo/:user_id", async (req, res) => {
  const { todo_description, todo_done } = req.body;
  const { user_id } = req.params;
  try {
    const newTodo = await pool.query(
      "INSERT INTO todos (todo_description, todo_done, user_id) VALUES ($1, $2, $3) RETURNING *",
      [todo_description, todo_done, user_id]
    );
    return res.status(200).json(newTodo.rows[0]);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get("/todo/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const todos = await pool.query("SELECT * FROM todos WHERE user_id = $1", [
      user_id,
    ]);
    return res.status(200).json(todos.rows);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
