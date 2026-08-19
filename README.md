# 🚀 PipeWise-AI

<div align="center">
  <img alt="PipeWise-AI Banner" src="https://via.placeholder.com/1000x200.png?text=PipeWise-AI+-+Full+ML+Pipeline" />
</div>

<p align="center">
  <strong>An end-to-end Machine Learning Pipeline API and intuitive web interface.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-endpoints">API Endpoints</a> •
  <a href="#contributing">Contributing</a>
</p>
---

## 💡 About PipeWise-AI

**PipeWise-AI** is a comprehensive, full-stack machine learning pipeline application. It simplifies the entire machine learning workflow from data uploading and cleaning, to advanced visualizations, model training, and deriving AI-powered insights. Whether you're a data scientist needing a quick prototyping tool or a developer integrating ML capabilities, PipeWise-AI offers a robust backend powered by FastAPI and an interactive frontend built with React and Vite.

## ✨ Features

- **📤 Data Upload:** Easily ingest datasets (CSV, Excel).
- **🧹 Data Cleaning:** Automated preprocessing, missing value handling, and data transformation.
- **📊 Visualization:** Generate rich, interactive charts to understand your data distribution.
- **🧠 Model Training:** Train multiple models (XGBoost, LightGBM, CatBoost, Scikit-Learn) with ease.
- **📈 Insights:** Generate AI-driven insights from your model evaluations.
- **💬 AI Chat:** Interact with your data and models through an integrated AI chat interface (Powered by Google GenAI & Groq).

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Charting:** Chart.js & react-chartjs-2
- **Data Parsing:** PapaParse

### Backend
- **Framework:** FastAPI
- **Data Manipulation:** Pandas, NumPy
- **Machine Learning:** Scikit-Learn, XGBoost, LightGBM, CatBoost
- **LLM Integration:** Google GenAI, Groq

## 📂 Project Structure

```text
PipeWise-AI/
├── backend/               # FastAPI Python Backend
│   ├── app.py             # Main entry point
│   ├── config.py          # Configuration settings
│   ├── requirements.txt   # Python dependencies
│   ├── routes/            # API Route definitions
│   ├── ml_engine/         # Core ML processing logic
│   └── models/            # Saved models
│
└── frontend/              # React + Vite Frontend
    ├── package.json       # Node dependencies
    ├── src/               # React components and views
    └── index.html         # Main HTML template
```

## 🚀 Getting Started

Follow these steps to run PipeWise-AI locally.

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.9 or higher)

### 1. Clone the repository
```bash
git clone https://github.com/SiddharthBarkund/PipeWise-AI.git
cd PipeWise-AI
```

### 2. Backend Setup
Navigate to the backend directory and set up a virtual environment.
```bash
cd backend
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python app.py
```
The backend will be running at `http://localhost:8000`.

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and start the Vite development server.
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend will be running at `http://localhost:5173`.
