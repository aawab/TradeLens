# TradeLens 🌍📊

*Interactive dashboard analyzing global trade patterns and socioeconomic development*

## Overview

TradeLens reveals how national development influences global purchasing patterns across 200+ countries. Data retrieved from [DataCo Global's Supply Chain Dataset]([url](https://www.kaggle.com/datasets/shashwatwork/dataco-smart-supply-chain-for-big-data-analysis)) and [World GeoData 2023]([url](https://github.com/georgique/world-geojson)) incorporated into choropleth maps, parallel coordinates, scatterplots, and k-means clustering analysis.

![Dashboard Overview](screenshots/dashboard-overview.png)

## 📊 Data Sources

- **DataCo Global Supply Chain**: Customer purchases, orders, delivery data, and department classifications
- **World GeoData 2023**: GDP, CO2 emissions, population, life expectancy for all countries

## 🚀 Key Discoveries

- **Technology & Wealth**: Strong correlation between high GDP countries (USA, Russia) and technology purchases
- **Population & Clothing**: High-population nations (China, India) dominate clothing sector activity  
- **Environment & Health**: Inverse relationship between CO2 emissions and life expectancy

![Key Findings](screenshots/key-findings.png)

## 🛠️ Getting Started

```bash
git clone https://github.com/aawab/TradeLens.git
cd TradeLens
npm start

```
Runs the app in the development mode.

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
