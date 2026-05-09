Real-Time Forum

Full-stack real-time forum with live chat, built using Go (backend) and Vanilla JavaScript (frontend) with WebSockets.

Features

User Authentication

Register with nickname, age, gender, name, email, password

Login using email or nickname

Session management

Password hashing with bcrypt

Posts & Comments

Create posts with categories

View posts feed

Add comments

Filter posts by category

Real-Time Chat

Private messaging between users

Online / offline status

Message history (lazy loading)

Real-time notifications

Project Structure

Frontend

web/
├── index.html
└── static/
    ├── assets/
    ├── styles/
    ├── views/
    ├── index.js
    └── utils.js

Backend

pkg/
├── db/
├── handlers/
├── helpers/
├── models/
└── websockets/

Entry

cmd/forum/
Tech Stack

Backend: Go, SQLite, Gorilla WebSocket

Frontend: Vanilla JS, Tailwind CSS

Run
go mod download
go run cmd/main.go

Open:
http://localhost:8080