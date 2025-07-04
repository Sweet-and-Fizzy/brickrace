# The Great Holyoke Brick Race 🏁

A modern web application for managing The Great Holyoke Brick Race - where performance art meets sport in the first brick race of its kind.

## Overview

The Great Holyoke Brick Race is a unique gravity-powered vehicle racing event that combines creativity, engineering, and artistic expression. This application provides a comprehensive platform for race management, participant registration, photo galleries, awards tracking, and community engagement.

## Features

### Public Features

- **Race Information**: View current and past races with detailed information
- **Photo Galleries**: Browse community-submitted photos from races and events
- **Racer Profiles**: Explore creative vehicles and their builders
- **Awards System**: View race results and award winners
- **Race Countdown**: Live countdown timer for upcoming races
- **Responsive Design**: Optimized for desktop and mobile devices

### Admin Features

- **Race Management**: Create and manage race events
- **Photo Moderation**: Review and approve user-submitted photos
- **Awards Management**: Create awards and assign winners
- **User Management**: Manage participant accounts and permissions
- **Dashboard**: Comprehensive admin interface with statistics

### User Features

- **Account Registration**: Create user accounts with authentication
- **Racer Registration**: Submit vehicle entries for races
- **Photo Uploads**: Share photos from races and events
- **Profile Management**: Manage personal racing history

## Technology Stack

- **Framework**: [Nuxt 3](https://nuxt.com/) - Vue.js framework
- **UI Library**: [PrimeVue](https://primevue.org/) - Vue.js component library
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Database**: [Supabase](https://supabase.com/) - Backend-as-a-service with PostgreSQL
- **Authentication**: Supabase Auth
- **State Management**: [Pinia](https://pinia.vuejs.org/) - Vue.js state management
- **Icons**: [PrimeIcons](https://primevue.org/icons/) - Icon library
- **Typography**: [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue) - Display font

## Project Structure

```
frontend/
├── assets/                 # Static assets (CSS, images)
├── components/            # Reusable Vue components
├── composables/          # Vue composables for shared logic
├── layouts/              # Application layouts
├── middleware/           # Route middleware (auth, admin)
├── pages/                # File-based routing pages
├── plugins/              # Nuxt plugins
├── public/               # Public static files
├── server/               # Server-side code
├── stores/               # Pinia state stores
└── types/                # TypeScript type definitions
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd brickrace/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run generate` - Generate static site
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Code Quality

This project uses:

- **ESLint** with Nuxt configuration for code linting
- **Prettier** for code formatting
- **Vue ESLint** for Vue.js specific rules

Run linting and formatting before committing:

```bash
npm run lint:fix
npm run format
```

### Database Schema

The application uses Supabase with the following main tables:

- `races` - Race events and information
- `racers` - Participant vehicles and registration
- `checkins` - Race day check-in tracking
- `awards` - Award definitions and categories
- `award_winners` - Award assignment to racers
- `general_photos` - Community photo uploads
- `users` - Authentication and user profiles

## Deployment

### Production Build

```bash
npm run build
```

### Static Generation

```bash
npm run generate
```

### Environment Variables

Ensure production environment variables are set:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Key Features Explained

### Photo Management

- Users can upload photos to community galleries
- Admin moderation system for photo approval
- Featured photo system for hero backgrounds
- Support for both general race photos and racer-specific photos

### Race System

- Active race countdown with real-time updates
- Race check-in system for participants
- Tournament bracket system for elimination rounds
- Qualifying rounds and final race management

### Awards System

- Flexible award categories (Speed, Creativity, Artistry, etc.)
- Photo upload support for awards
- Winner assignment and public display
- Historical award tracking

### Authentication & Authorization

- Supabase-based user authentication
- Role-based access control (Admin, Race Admin, User)
- Protected routes with middleware
- User profile management

## Design Philosophy

The application embraces a DIY/maker aesthetic that matches the creative spirit of the brick race community:

- Clean, modern interface with subtle industrial design elements
- Red color scheme reflecting the brick theme
- Bebas Neue typography for bold, impactful headers
- Responsive design optimized for community engagement

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and formatting: `npm run lint:fix && npm run format`
5. Commit your changes with descriptive messages
6. Push to your fork and submit a pull request

## Support

For questions or issues:

- Check the documentation
- Review existing issues
- Create a new issue with detailed information

## License

This project is part of The Great Holyoke Brick Race community event.

---

Built with ❤️ for the creative racing community
