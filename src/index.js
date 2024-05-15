const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((res) => {
  res
    ? console.log("Erro ao conectar ao banco de dados!")
    : console.log("Conectado ao banco de dados com sucesso!");
});

const app = express();
app.use(cors());

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
    const todos = await pool.query("SELECT * FROM todos WHERE user_id = ($1)", [
      user_id,
    ]);
    return res.status(200).json(todos.rows);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.patch("/todo/:user_id/:todo_id", async (req, res) => {
  const { todo_id, user_id } = req.params;
  const data = req.body;
  try {
    const belongsToUser = await pool.query(
      "SELECT * FROM todos WHERE user_id = ($1) WHERE todo_id = ($2)",
      [user_id, todo_id]
    );
    if (!belongsToUser.rows[0])
      return res.status(400).json({ error: "Operation Not Allowed" });
    const updateTodo = await pool.query(
      "UPDATE todos SET todo_description = ($1), todo_done = ($2) WHERE todo_id = ($3) RETURNING *",
      [data.todo_description, data.todo_done, todo_id]
    );
    return res.status(200).json(updateTodo.rows[0]);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.delete("/todo/:user_id/:todo_id", async (req, res) => {
  const { todo_id, user_id } = req.params;
  try {
    const deleteTodo = await pool.query(
      "DELETE FROM todos WHERE todo_id = ($1) AND user_id = ($2) RETURNING *",
      [todo_id, user_id]
    );
    return res.status(200).send(
      message, 'Todo deleted successfully',
      deleteTodo.rowCount
    );
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
