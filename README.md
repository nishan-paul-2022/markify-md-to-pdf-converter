<div align="center">
  <img src="public/brand-logo.svg" alt="Markify Logo" width="120" height="120" />
  <h1>Markify</h1>
  <p>Professional Markdown to PDF Conversion Suite</p>
</div>

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

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Full Type Safety)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix UI)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/) (Auth.js)
- **PDF Engine**: [Playwright](https://playwright.dev/) (Chromium)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)

---

## 🚀 Step-by-Step Installation

Follow these steps to get Markify up and running in minutes.

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js 20+**
- **Docker** and **Docker Compose**

### 2. Environment Configuration
Clone the repository and set up your local environment file:
```bash
cp .env.example .env
```
Generate a secure authentication secret and add it to `AUTH_SECRET` in your `.env`:
```bash
openssl rand -base64 32
```

### 3. Google OAuth Setup
To enable authentication, you need to create credentials in the [Google Cloud Console](https://console.cloud.google.com/).

**Step-by-step Guide:**
1.  **Create a Project**: Click the project dropdown and select "New Project".
2.  **OAuth Consent Screen**: Search for "OAuth consent screen", choose "External", and fill in the required fields.
3.  **Create Credentials**: Go to "Credentials" > "Create Credentials" > "OAuth client ID".
4.  **Configure**:
    *   **Application type**: Web application.
    *   **Authorized redirect URIs**: Add `http://localhost:3000/api/auth/callback/google`.
5.  **Save**: Copy the **Client ID** and **Client Secret** into your `.env` file.

### 4. Launch the Application
Choose your preferred method of running the app:

#### Option A: Docker (Recommended)
This installs all dependencies and starts the database/app in containers.
```bash
make setup    # First-time initialization
make up       # Subsequent runs
```

#### Option B: Local Development
Fastest for coding. Runs the database in Docker and the app on your host machine.

1. **Install Dependencies:**
```bash
npm install
```

2. **Setup Playwright (Required for PDF):**
```bash
npx playwright install chromium
sudo npx playwright install-deps chromium  # Linux only
```

3. **Fix Directory Permissions (Linux Only):**
Prevents `EACCES` errors when uploading files:
```bash
make fix-perms
```

4. **Run Server:**
```bash
make dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the app.

---

## 📑 Management Commands

| Command | Description |
| :-- | :-- |
| `make setup` | **First-time install**: Docker setup + DB schema sync |
| `make dev` | Run Next.js locally with Docker DB (Fastest for coding) |
| `make up` | Start production-ready containers |
| `make build` | Force rebuild Docker images and restart |
| `make logs` | Follow application logs |
| `make fix-perms` | Fix file permission issues in `public/uploads` (Linux) |
| `make down` | Stop all services |
| `make clean` | Reset everything (removes volumes and images) |

---

<div align="center">
  <img src="public/company-logo.svg" alt="KAI Team Logo" width="80" height="80" />
  <p>Built with ❤️ by the <b>KAI team</b>.</p>
</div>
