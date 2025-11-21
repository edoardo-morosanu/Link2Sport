# Link2Sport - Sports Event Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go](https://github.com/edoardo-morosanu/Link2Sport/actions/workflows/go.yml/badge.svg)](https://github.com/edoardo-morosanu/Link2Sport/actions/workflows/go.yml)

Link2Sport is a modern web application designed to connect sports enthusiasts, enabling them to create, join, and manage sports events in their local communities. Built with a microservices architecture, it provides a seamless experience for users to discover and participate in various sporting activities.

## 🌟 Features

- **User Authentication & Authorization**
  - Secure JWT-based authentication
  - Role-based access control
  - Social login integration

- **Event Management**
  - Create and manage sports events
  - Filter events by sport, location, and date
  - Join/Leave events with a single click
  - Real-time event updates

- **User Profiles**
  - Personal dashboard
  - Event history and statistics
  - Skill level indicators
  - User ratings and reviews

- **Real-time Communication**
  - In-app messaging
  - Event notifications
  - Chat functionality

## 🚀 Tech Stack

### Backend
- **Language**: Go (Golang)
- **Framework**: Gin Web Framework
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Form Handling**: React Hook Form
- **UI Components**: Shadcn/UI

## 🛠️ Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Go 1.21+
- PostgreSQL 14+

## 🚀 Getting Started

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/edoardo-morosanu/Link2Sport.git
   cd Link2Sport
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Update the environment variables in .env as needed
   ```

3. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: PostgreSQL on port 5432

### Running Tests

```bash
# Run backend tests
cd backend
go test -v ./...

# Run frontend tests
cd ../frontend
npm test
```

## 📦 Deployment

The application can be deployed using Docker:

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## 📚 API Documentation

API documentation is available at `/api/docs` when running the development server.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

Project Link: [https://github.com/edoardo-morosanu/Link2Sport](https://github.com/edoardo-morosanu/Link2Sport)

## 🙏 Acknowledgments

- [Fontys University](https://fontys.nl/)
- All contributors who have helped shape this project
