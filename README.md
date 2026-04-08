# ✈ SkyAgent
### AI-Powered Flight Booking System

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

SkyAgent is a full-stack AI-powered flight booking web application that uses Natural Language Processing (NLP) to understand user travel requests and supports both automatic and manual flight booking flows. Users can simply type their travel intent in plain English and the system intelligently handles the rest.

Built with a modern React frontend and a FastAPI backend, SkyAgent integrates Firebase Authentication for secure login and provides a sleek, dark-themed UI with real-time feedback and animations.

---

## 📌 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Booking Flow](#-booking-flow)
- [Getting Started](#-getting-started)
- [Example NLP Inputs](#-example-nlp-inputs)

---

## ⚡ Key Features

### 🧠 NLP-Based Booking System
SkyAgent uses a custom NLP parser to understand natural language travel requests. It automatically detects intent and extracts key entities such as origin, destination, date, and passenger name.

- **Search Intent** — e.g. *"Show me flights from Mumbai to Delhi on Friday"*
- **Book Intent** — e.g. *"Book a flight for Raj from Guwahati to Delhi next Tuesday"*

### ✈️ Automatic Booking
When the user provides a complete booking request, SkyAgent processes it end-to-end without manual flight selection:
- NLP parser extracts all booking details
- Backend agent searches for available flights
- Best flight is automatically selected and booked
- User sees a confirmation animation followed by booking details

### 🗂️ Manual Booking
When a search-only request is detected, SkyAgent presents available flights for the user to choose from:
- Flights displayed with airline, flight number, departure/arrival times, and price
- User selects a preferred flight, enters passenger name and age
- System confirms the booking and shows full details

### 🔐 Firebase Authentication
- Google Sign-In via Firebase OAuth
- Email & Password Registration and Login
- Duplicate email detection and error handling
- Auto-redirect to register tab for unregistered credentials
- Session cleared on every app restart for security
- Goodbye animation on logout with delay

### 🎨 UI/UX Highlights
- Dark glassmorphism card design with animated background blobs
- Animated loading states: Searching → Booking → Confirming
- Toast popup notifications for errors and success messages
- Smooth page transitions between booking steps
- Fully responsive and fullscreen layout

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js (Vite) |
| **Backend** | FastAPI (Python) |
| **Authentication** | Firebase (Google + Email/Password) |
| **NLP Parser** | Custom Python NLP Agent |
| **Styling** | Inline CSS + Custom CSS |
| **API Communication** | REST (fetch API) |
| **State Management** | React `useState` / `useEffect` |

---

## 📁 Project Structure

```
skyagent/
├── frontend/
│   ├── src/
│   │   ├── TravelAgent.jsx      # Main UI component
│   │   ├── firebase.js          # Firebase auth config & helpers
│   │   └── App.jsx              # Root component
│   └── package.json
├── backend/
│   ├── main.py                  # FastAPI app & API endpoints
│   ├── app/
│   │   ├── flight_parser.py     # NLP travel request parser
│   │   ├── flight_search.py     # Flight search agent
│   │   ├── booking_engine.py    # Booking creation logic
│   │   └── payment.py           # Payment processing
│   └── requirements.txt
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ai-book-flight` | NLP endpoint — parses intent, returns flights or auto-books |
| `POST` | `/book-flight/{index}` | Manual booking — books selected flight by index with passenger details |

---

## 🔄 Booking Flow

### Automatic Booking
```
User types full booking request
        ↓
NLP detects "book" intent → extracts passenger, origin, destination, date
        ↓
User enters age
        ↓
System selects & books best available flight
        ↓
Confirming animation → ✅ Flight Successfully Booked
```

### Manual Booking
```
User types search request
        ↓
NLP detects "search" intent → returns available flights
        ↓
User enters age → selects a flight → enters passenger name
        ↓
Confirming animation → ✅ Flight Successfully Booked
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Python 3.10+
- Firebase project with Google and Email/Password auth enabled

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Firebase Configuration

Create a `firebase.js` file in `src/` with your Firebase project config:

```js
const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id"
};
```

### CORS Configuration

Add the following to your FastAPI backend to allow requests from the React dev server:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:5173"],
  allow_methods=["*"],
  allow_headers=["*"],
)
```

---

## 💬 Example NLP Inputs

| Input | Intent | Result |
|---|---|---|
| *"Book a flight for Raj from Mumbai to Delhi on Friday"* | `book` | Auto-books best flight |
| *"Show flights from Guwahati to Delhi next Tuesday"* | `search` | Returns flight list |
| *"Find me a business class flight from London to Tokyo next Monday"* | `search` | Returns flight list |

---

<div align="center">
  Built with ❤️ using React + FastAPI + Firebase &nbsp;•&nbsp; SkyAgent © 2026
</div>
