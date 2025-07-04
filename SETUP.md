# TradeLens Setup Guide

## 🚀 Complete Installation Instructions

This guide will help you complete the setup after Phase 1 migration to TypeScript + Vite.

## Prerequisites

### 1. Install Node.js
Download and install Node.js 18+ from: https://nodejs.org/
```bash
# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show npm version
```

### 2. Install Git (if not already installed)
Download from: https://git-scm.com/

## Step-by-Step Setup

### Step 1: Install Dependencies
```bash
# Install all required packages
npm install

# This will install:
# - React 18 + TypeScript
# - Vite build system
# - Material-UI components
# - Zustand state management
# - D3.js for visualizations
# - All TypeScript types
```

### Step 2: Development Server
```bash
# Start the development server
npm run dev

# The app will open at: http://localhost:3000
# Hot reload is enabled for development
```

### Step 3: Verify Installation
After running `npm run dev`, you should see:
- ✅ No TypeScript compilation errors
- ✅ Application loads at localhost:3000
- ✅ Material-UI components render correctly
- ✅ Placeholder visualizations display (pending D3 implementation)

## Available Scripts

```bash
# Development
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint checks
npm run type-check   # Run TypeScript checks
```

## Project Structure After Setup

```
TradeLens-master/
├── node_modules/           # Dependencies (created after npm install)
├── dist/                   # Production build (created after npm run build)
├── frontend/
│   ├── components/
│   │   ├── BarChart.tsx   ✅ TypeScript ready
│   │   ├── Map.tsx        ⏳ Needs conversion
│   │   ├── PCP.tsx        ⏳ Needs conversion
│   │   └── ScatterPlot.tsx ⏳ Needs conversion
│   ├── types/index.ts     ✅ Complete
│   ├── stores/appStore.ts ✅ Complete (needs zustand activation)
│   ├── services/dataService.ts ✅ Complete
│   ├── assets/            ✅ Data files organized
│   ├── App.tsx           ✅ TypeScript conversion complete
│   └── index.tsx         ✅ TypeScript entry point
├── package.json          ✅ Updated dependencies
├── tsconfig.json         ✅ TypeScript configuration
├── vite.config.ts        ✅ Vite configuration
└── README.md             ✅ Updated documentation
```

## Post-Installation Tasks

### 1. Activate Zustand Store
Once dependencies are installed, replace the placeholder store in `frontend/stores/appStore.ts`:

```typescript
// Remove placeholder and uncomment the real Zustand implementation
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // ... store implementation
    }),
    { name: 'tradelens-app-store' }
  )
);
```

### 2. Complete Component Conversions
The following components need TypeScript conversion:
- `frontend/components/Map.tsx`
- `frontend/components/PCP.tsx`
- `frontend/components/ScatterPlot.tsx`

### 3. Enable React Query
Uncomment the React Query setup in `frontend/index.tsx` after installation.

## Troubleshooting

### Common Issues

**Issue: npm install fails**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Issue: TypeScript errors**
```bash
# Run type checking
npm run type-check

# Most errors should resolve after npm install
```

**Issue: Port 3000 already in use**
```bash
# Use different port
npm run dev -- --port 3001
```

**Issue: Vite config errors**
Make sure you have the latest Node.js version. Vite requires Node 18+.

### Performance Optimization

```bash
# Production build
npm run build

# Analyze bundle size
npm run build && npm run preview
```

## Next Steps (Phase 2)

After successful setup, you'll be ready for:

1. **Backend API Development**
   - Express.js + TypeScript server
   - PostgreSQL database integration
   - Prisma ORM setup

2. **Python Analytics Service**
   - FastAPI implementation
   - Machine learning pipeline
   - Data processing automation

3. **Full Integration**
   - Docker containerization
   - Production deployment
   - CI/CD pipeline

## Support

If you encounter issues:
1. Check Node.js version (must be 18+)
2. Clear npm cache and reinstall dependencies
3. Review console errors in browser dev tools
4. Check the GitHub repository for updates

---

**Ready to start development?**
```bash
npm run dev
```

The app will be available at `http://localhost:3000` with hot reload enabled! 🚀 