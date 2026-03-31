#Pharma Tracker UI

A React application built with Vite for tracking pharmaceutical data, featuring environment-specific configurations for staging and production.

## Features

- ⚡ **Vite** - Fast build tool and dev server
- ⚛️ **React 19** - Latest React with modern features
- 🌍 **Environment Configuration** - Separate configs for staging and production
- 🔧 **API Service** - Built-in HTTP client for RESTful API communication
- 📱 **Responsive Design** - Modern UI with environment indicators

## Environment Configuration

This project supports three environments:

- **Local Development** (`env.local`) - For local development
- **Staging** (`env.staging`) - For testing and staging environments
- **Production** (`env.production`) - For production deployment

### Environment Variables

Each environment file contains:

- `VITE_API_BASE_URL` - Base URL for the RESTful API server
- `VITE_ENV` - Environment identifier

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

#### Local Development

```bash
npm run dev
```

Uses `env.local` configuration (defaults to `http://localhost:3000`)

#### Staging Development

```bash
npm run dev:staging
```

Uses `env.staging` configuration

#### Production Development

```bash
npm run dev:production
```

Uses `env.production` configuration

### Building

#### Local Build

```bash
npm run build
```

#### Staging Build

```bash
npm run build:staging
```

#### Production Build

```bash
npm run build:production
```

### Preview

#### Local Preview

```bash
npm run preview
```

#### Staging Preview

```bash
npm run preview:staging
```

#### Production Preview

```bash
npm run preview:production
```

## Project Structure

```
pharma-tracker-ui/
├── src/
│   ├── config/
│   │   └── environment.js      # Environment configuration
│   ├── services/
│   │   └── api.js             # API service utilities
│   ├── App.jsx                # Main application component
│   └── App.css                # Application styles
├── env.local                   # Local environment config
├── env.staging                # Staging environment config
├── env.production             # Production environment config
├── vite.config.js             # Vite configuration
└── package.json               # Project dependencies and scripts
```

## API Configuration

The application automatically configures API communication based on the selected environment:

- **Local**: `http://localhost:3000`
- **Staging**: `https://staging-api.pharma-tracker.com`
- **Production**: `https://api.pharma-tracker.com`

## Environment Indicators

The UI displays environment information including:

- Current environment
- API base URL
- Debug mode status
- Logging status
- Visual environment badges

## Available Scripts

- `npm run dev` - Start development server (local)
- `npm run dev:staging` - Start development server (staging)
- `npm run dev:production` - Start development server (production)
- `npm run build` - Build for production (local)
- `npm run build:staging` - Build for staging
- `npm run build:production` - Build for production
- `npm run preview` - Preview production build (local)
- `npm run preview:staging` - Preview staging build
- `npm run preview:production` - Preview production build
- `npm run lint` - Run ESLint

## Customization

### Adding New Environment Variables

1. Add the variable to your environment file (e.g., `env.staging`)
2. Access it in your code using `import.meta.env.VITE_YOUR_VARIABLE`

### Modifying API Configuration

Edit `src/config/environment.js` to modify:

- API timeout settings
- Default headers
- Feature flags
- App metadata

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in all environments
5. Submit a pull request

## License

This project is licensed under the MIT License..
