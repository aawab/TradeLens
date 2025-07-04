# TradeLens 🔎📊

*Interactive dashboard for comparing global trade patterns and socioeconomic development*

## Overview

TradeLens reveals how national development influences global purchasing patterns across 200+ countries. Data retrieved from [DataCo Global's Supply Chain Dataset](https://www.kaggle.com/datasets/shashwatwork/dataco-smart-supply-chain-for-big-data-analysis) and [World GeoData 2023](https://github.com/georgique/world-geojson) incorporated into choropleth maps, parallel coordinates, scatterplots, and k-means clustering analysis.

![TradeLens Dashboard](./public/TradeLens%20-%20Dashboard.png)

## 🚀 Key Discoveries

- **Technology & Wealth**: Strong correlation between high GDP countries (USA, Russia) and technology purchases
- **Population & Clothing**: High-population nations (China, India) dominate clothing sector activity  
- **Environment & Health**: Inverse relationship between CO2 emissions and life expectancy

## 🌟 Features

### 📍 **Interactive World Map**
Explore country development metrics with dynamic choropleth visualization featuring GDP, population, life expectancy, and CO2 emissions data.

![World Heatmap](./public/TradeLens-%20World%20Heatmap.png)

### 📈 **Scatter Plot Analysis**
Discover correlations between socioeconomic indicators with interactive scatter plots supporting dynamic variable selection and country filtering.

![Scatter Plot](./public/TradeLens%20-%20Scatter.png)

### 🎯 **Parallel Coordinates Plot**
Analyze multi-dimensional relationships across development indicators with interactive parallel coordinates visualization.

![Parallel Coordinates](./public/TradeLens%20-%20PCP.png)

### 🤖 **K-Means Clustering**
Machine learning-powered country clustering with elbow method optimization and MSE analysis for pattern discovery.

![K-Means Clustering](./public/TradeLens%20-%20MSE.png)

### 🎛️ **State Management**
Reactive state management with Zustand for seamless data filtering and component synchronization.

![State Management](./public/TradeLens%20-%20State.png)

## 📊 Data Sources

- **DataCo Global Supply Chain**: Customer purchases, orders, delivery data, and department classifications
- **World GeoData 2023**: GDP, CO2 emissions, population, life expectancy for all countries

## 🛠️ Tech Stack

### **Frontend**
- **React 18 + TypeScript**: Modern component-based architecture
- **Material-UI v5**: Responsive, accessible design system
- **D3.js**: Interactive data visualizations
- **Zustand**: Lightweight state management
- **Vite**: Fast development and build tool

### **Backend**
- **Express.js + TypeScript**: RESTful API server
- **PostgreSQL**: Relational database for structured data
- **Node.js**: Server-side JavaScript runtime

### **Analytics**
- **Scikit-learn**: Machine learning algorithms (K-means clustering)
- **Python**: Data processing and analysis
- **FastAPI**: High-performance API framework (planned)

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/aawab/TradeLens.git
cd TradeLens

# Install dependencies
npm install

# Start development server
npm run dev
```

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Backend Setup (Optional)
```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Start backend server
npm run dev
```

## 📁 Project Structure

```
TradeLens/
├── frontend/
│   ├── components/          # Interactive visualization components
│   │   ├── BarChart.tsx    # K-means MSE visualization
│   │   ├── Map.tsx         # Interactive world map
│   │   ├── PCP.tsx         # Parallel coordinates plot
│   │   └── ScatterPlot.tsx # Scatter plot analysis
│   ├── services/           # Data fetching and processing
│   ├── stores/             # Zustand state management
│   └── types/              # TypeScript definitions
├── public/
│   └── data/               # Static data files
│       ├── worldWithData.geojson # Geographic boundaries
│       └── world-data-2023.csv   # Country metrics
├── backend/                # Express.js API + PostgreSQL
│   ├── routes/             # API endpoints
│   ├── scripts/            # Database utilities
│   └── server.js           # Express server
```

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run TypeScript/ESLint checks
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 🙏 Acknowledgments

- **D3.js** for powerful data visualization capabilities
- **Material-UI** for beautiful, accessible components
- **React & TypeScript** for robust frontend development
- **Zustand** for simple, effective state management

---

*Explore the intersection of global trade and development with TradeLens* 🌍✨
