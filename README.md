# Connection Monitor

[![Docker Image](https://img.shields.io/docker/v/zijunyi/connection-monitor?sort=semver&logo=docker)](https://hub.docker.com/r/zijunyi/connection-monitor)
[![Docker Pulls](https://img.shields.io/docker/pulls/zijunyi/connection-monitor?logo=docker)](https://hub.docker.com/r/zijunyi/connection-monitor)

A real-time connection monitoring dashboard built with Next.js and Chart.js. Available as a Progressive Web App (PWA) with Docker containerization.

## Features

- Real-time connection status monitoring
- Interactive charts and visualizations
- PWA support for offline access
- Modern, responsive UI with Tailwind CSS
- Multi-architecture Docker support (amd64/arm64)

## Docker Quick Start

```bash
# Pull the image
docker pull zijunyi/connection-monitor:latest

# Run the container
docker run -p 3000:3000 zijunyi/connection-monitor:latest
```

Visit [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Development Options

### Using Docker Compose
```bash
docker-compose up --build
```

### Traditional Development
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Build & Deploy

### Local Build
```bash
npm run build
npm start
```

### Docker Build
```bash
docker build -t connection-monitor .
docker run -p 3000:3000 connection-monitor
```

## Tech Stack

- Next.js
- React
- Chart.js
- Tailwind CSS
- TypeScript
- Docker
