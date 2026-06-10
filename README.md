# Arbolia - Urban Forestry Management System

**Version:** 2.0.0  
**Platform:** Web Application (React / TypeScript / Vite)  
**Infrastructure:** Firebase (Firestore, Storage, Auth) & Vercel Hosting  

Arbolia is a comprehensive web-based platform designed for urban forestry management. It provides tools for georeferenced tree inventory, real-time phytosanitary monitoring, legal compliance tracking, field service management, and forestry auditing. It is built specifically for forestry engineers, agronomists, field technicians, and urban environmental planners.

## Core Features

### 1. Offline-First Architecture
Built with Firebase Firestore's offline persistence, the application allows field engineers to complete inventories and technical reports in areas with poor or no internet connectivity. Data is synchronized automatically when the connection is restored.

### 2. ISA Standard Risk Assessment
Generates tree risk and phytosanitary reports based on the International Society of Arboriculture (ISA) TRAQ methodology. The system calculates risk matrices based on failure probability, impact probability, and consequences, providing mitigation strategies and residual risk projections.

### 3. Integrated Client-Side PDF Generation
Produces professional, vector-based PDF reports directly in the browser using `jsPDF` and `AutoTable`. Reports include corporate branding, technician credentials (CREA), interactive matrices, and automated uploads to Firebase Storage, with a local Base64 fallback mechanism for offline scenarios.

### 4. Interactive Georeferenced Mapping
Features a Leaflet-based map with real-time bidirectional synchronization with the data list. Trees are mapped with color-coded pins based on calculated risk levels, supporting multi-selection and bulk service scheduling.

### 5. Automated AI Technical Translation
Utilizes the Google Gemini REST API to translate complex biological terminology and risk assessments into accessible language for end-clients. Includes robust error handling and multi-model fallback mechanisms to ensure high availability and prevent rate-limit failures.

### 6. Climatic Monitoring and Safety Matrices
Integrates with the Open-Meteo API for real-time weather tracking. The system features a reactive operational safety matrix that evaluates combined weather conditions (e.g., wind gusts, precipitation) to recommend or suspend field operations.

### 7. Comprehensive Audit Logging
Maintains a strict, immutable audit log of all database operations (`CREATE`, `UPDATE`, `DELETE`) for compliance. Tracks user IDs, actions, timestamps, and exact payload differences.

## Technology Stack

| Category | Technology |
| --- | --- |
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Backend & Database** | Firebase (Firestore, Authentication, Storage) |
| **Hosting** | Vercel |
| **Styling** | Tailwind CSS 4 |
| **State Management** | Zustand 5 (with persistent local cache) |
| **Mapping & GIS** | Leaflet 1.9, React Leaflet 5 |
| **Data Visualization** | Recharts 3.8 |
| **Document Generation** | jsPDF, jsPDF-AutoTable |

## Database Architecture (NoSQL)

The system uses a document-oriented structure optimized for fast field queries:

*   **profiles:** Technician and administrative user data (CREA, roles).
*   **clients:** Customer and property data.
*   **trees:** Georeferenced tree assets, including physical characteristics and risk status.
*   **services:** Scheduled and completed field operations (pruning, suppression, evaluation).
*   **audit_logs:** Transactional history for legal compliance.

## Local Development Setup

### Prerequisites
*   Node.js (v20 or higher)
*   npm or yarn

### Installation Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/rafaelcaetite/Arbolia.git
    cd Arbolia/app
    ```

2.  **Environment Configuration:**
    Create a `.env` file in the `app/` directory based on `.env.example`:
    ```env
    VITE_FIREBASE_API_KEY=your_firebase_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_GEMINI_API_KEY=your_gemini_api_key
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Deployment

The application is configured for deployment on Vercel. 
Pushing to the `main` branch automatically triggers a production build.
The `vercel.json` file handles Single Page Application (SPA) routing rewrites.

---
*Note: This repository contains proprietary structural logic and requires authorized API keys to function properly.*