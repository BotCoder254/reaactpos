# 🛍️ Modern POS System

A modern, feature-rich Point of Sale (POS) system built with React, Firebase, and Tailwind CSS. This application provides a comprehensive solution for managing sales, inventory, employees, and business analytics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-blue)
![Firebase](https://img.shields.io/badge/Firebase-10.x-orange)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38B2AC)

## ✨ Features

### 💼 Sales Management
- **POS Interface**: User-friendly interface for processing sales
- **Order Management**: Track and manage orders in real-time
- **Sales History**: Comprehensive sales history and transaction logs
- **Sales Goals**: Set and track daily, weekly, and monthly sales targets
- **Progress Tracking**: Visual progress bars and real-time achievement tracking

### 📊 Analytics & Reporting
- **Dashboard**: Real-time overview of business metrics
- **Sales Analytics**: Detailed sales analysis and trends
- **Employee Performance**: Track employee sales and performance
- **Custom Reports**: Generate customized reports for business insights

### 👥 User Management
- **Role-Based Access**: Different permissions for managers and cashiers
- **Employee Management**: Manage staff profiles and permissions
- **Staff Statistics**: Track employee performance metrics

### 🏷️ Product Management
- **Inventory Management**: Track stock levels and product details
- **Discount Management**: Create and manage promotional offers
- **Low Stock Alerts**: Automated notifications for low inventory

### 🔐 Security
- **Authentication**: Secure user authentication with Firebase
- **Role-Based Authorization**: Protected routes and features
- **Real-time Data**: Secure real-time updates with Firestore

## 🚀 Quick Start

### Prerequisites
- Node.js 16.x or later
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/reaactpos.git
cd reaactpos
```

2. Install dependencies:
```bash
npm install
```

3. Create a Firebase project and add your configuration to `src/firebase.js`

4. Start the development server:
```bash
npm start
```

## 🐳 Docker Deployment

### Local Development with Docker

1. Build the Docker image:
```bash
docker build -t reaactpos .
```

2. Run the container:
```bash
docker run -p 3000:3000 reaactpos
```

### Docker Compose (Development)
```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
```

## 🌐 Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

Configuration file (`vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "build" }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/favicon.ico",
      "dest": "/favicon.ico"
    },
    {
      "src": "/manifest.json",
      "dest": "/manifest.json"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Render Deployment

1. Create a `Dockerfile` in your project root:
```dockerfile
# Build stage
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Create `nginx.conf`:
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
```

3. Deploy to Render:
   - Connect your GitHub repository
   - Select "Web Service"
   - Choose "Docker" as the environment
   - Set the build command: `docker build -t app .`
   - Set the start command: `docker run -p 80:80 app`

## 📝 Available Scripts

- `npm start`: Run development server
- `npm test`: Run tests
- `npm run build`: Build for production
- `npm run eject`: Eject from Create React App

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Hero Icons](https://heroicons.com/)
