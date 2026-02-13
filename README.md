# Markify

Markify is a professional, high-performance web application designed to convert Markdown into beautiful, high-fidelity PDF reports. Built with **Next.js**, **Playwright**, and **Tailwind CSS v4**, it features real-time preview and seamless Mermaid diagram support.

## ✨ Core Features

- **📄 Pro PDF Generation**: High-fidelity PDF output using Playwright engine.
- **📊 Mermaid Support**: Native support for diagrams and charts within Markdown.
- **📝 Live Preview**: Real-time side-by-side rendering as you type.
- **🔐 Secure Auth**: Seamless Google OAuth integration with NextAuth.js v5.
- **📁 File Management**: Robust storage and organization of your documents.
- **🎨 Elite UI**: Stunning dark-mode interface built with Shadcn UI.
- **🐳 Docker Ready**: Fully containerized for instant deployment.

---

## 🚀 Quick Start (Efficient Way)

### Prerequisites
- **Node.js 20+** & **Docker** installed.

### 1. Initialize Environment
Clone the repository and prepare your environment variables:
```bash
cp .env.example .env
```
*Note: Configure your Google OAuth credentials in `.env` for authentication to work.*

### 2. First-Time Setup
The most efficient way to initialize everything is using the `Makefile`:
```bash
make setup
```
This command installs dependencies, starts Docker services, and syncs the database schema.

### 3. Subsequent Runs
Once setup is complete, you can start the application anytime with:
```bash
make up
```
Visit [http://localhost:3000](http://localhost:3000) to access the app.

---

## 🛠️ Development & Local Setup

If you prefer running the application locally for faster development:

### Local Dev Mode (Recommended)
This runs the database in Docker but the Next.js app on your host machine:
```bash
npm install     # Install dependencies locally
make dev        # Starts DB in Docker and runs 'npm run dev' locally
```

### Build from Source
To rebuild the Docker images after making changes to the configuration or dependencies:
```bash
make build
```

---

## 📑 Management Commands

| Command | Description |
| :-- | :-- |
| `make setup` | **First-time install**: Installs npm deps, starts containers, syncs DB |
| `make up` | Start existing containers (Standard run) |
| `make dev` | Run Next.js locally with Docker DB (Fastest for coding) |
| `make build` | Force rebuild Docker images and restart |
| `make fix-perms` | Fix file permission issues in `public/uploads` (Linux) |
| `make logs` | Follow application logs |
| `make down` | Stop all services |
| `make clean` | Reset everything (removes volumes and images) |

## 📦 Project Structure

- `src/features/` - Core logic (Editor, File Management, Converter)
- `src/app/` - Next.js App Router (Pages & API)
- `prisma/` - Database schema and migrations
- `public/uploads/` - Secure user file storage

---
Built with ❤️ for developers by the Markify team.
