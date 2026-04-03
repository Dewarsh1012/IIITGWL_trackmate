# TrackMate — Real-Time Safety Monitoring Platform

"Know Where. Stay Safe."

TrackMate is a comprehensive civic safety platform designed for real-time monitoring of tourists, residents, and businesses within a geographic jurisdiction. It empowers local authorities with geo-fencing, incident reporting, dynamic safety scoring, alert broadcasting, and a full E-FIR (Electronic First Information Report) system.

## 🚀 Features

*   **Real-Time Location Tracking**: Live monitoring of all active platform users (Tourists, Residents, Businesses) on interactive maps with offline handling.
*   **Incident Reporting System**: Allows users to file incidents with severity levels, media attachments, and mapped locations appearing instantly on the Authority dashboard.
*   **Zone Management (Geo-Fencing)**: Create Risk and Safe zones on the map. Entering high-risk areas dynamically triggers alerts and impacts safety scores.
*   **Dynamic Safety Score System**: A gamified 0-100 real-time score based on user behaviors (e.g., maintaining low-risk zones vs. entering high-risk areas).
*   **Alert System**: Priority-based broadcasts to target groups or individuals. Critical alerts prompt forced modal acknowledgments.
*   **E-FIR System**: Authority-managed complete First Information Reporting flow seamlessly linked with user incidents.
*   **Safety Analytics Dashboard**: Beautiful and reactive KPI charts detailing incident trends and heatmaps.
*   **User Profiles & Roster**: Keep track of everyone in your jurisdiction utilizing securely generated Blockchain IDs.

## 💻 Tech Stack

**Frontend** (`Tackmate_Frontend`)
*   React 18 + TypeScript
*   Vite 5
*   Zustand & React Query
*   Tailwind CSS (Claymorphism UI Aesthetic)
*   Leaflet.js Maps
*   Socket.IO Client

**Backend** (`Trackmate_Backend`)
*   Node.js + Express.js 5 + TypeScript
*   PostgreSQL 16 with Prisma ORM
*   Redis 7 (Live location cache & Socket rooms)
*   Socket.IO Server

**Mobile** (`Trackmate_app`)
*   Flutter

## 🛠️ Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   PostgreSQL
*   Redis

### Installation & Setup

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository_url>
    cd IIITGWL_trackmate
    ```

2.  **Install dependencies** for both the frontend and backend using the root workspace:
    ```bash
    npm run install:all
    ```

3.  **Environment Variables**:
    *   Navigate to `Trackmate_Backend/` and set up your `.env` following `.env.example` (Database URLs, JWT secrets, etc.).
    *   Navigate to `Tackmate_Frontend/` and set up your `.env` (API endpoints).

4.  **Database Migration**:
    *   Navigate to the backend directory and run your Prisma migrations.
    ```bash
    cd Trackmate_Backend
    npx prisma migrate dev
    ```

### Running the Application

You can easily spin up both the React frontend and Node server simultaneously from the root directory:

```bash
npm run dev
```

*   **Frontend**: Usually available at `http://localhost:5173`
*   **Backend API**: Usually available at `http://localhost:5000`

For the Flutter mobile application:
```bash
cd Trackmate_app
flutter run
```

## 📜 Role-Based Access

TrackMate has 4 primary user roles:
1.  **Authority**: Government / Admin Control Center. Full system access.
2.  **Tourist**: Tracked user, localized alerts, SOS emergency feature.
3.  **Resident**: Tracked user, localized alerts, neighborhood reports.
4.  **Business**: Tracked location, business compliance tracking, localized alerts.

---

*Designed and engineered for maximum reliability, speed, and real-time civic safety.*
