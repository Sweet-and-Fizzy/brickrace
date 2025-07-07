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
- pnpm (recommended) or npm
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd brickrace/frontend
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**

   ```bash
   pnpm run dev
   ```

   The application will be available at `http://localhost:3000`

## Development

### Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run generate` - Generate static site
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix ESLint issues automatically
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check code formatting

### Code Quality

This project uses:

- **ESLint** with Nuxt configuration for code linting
- **Prettier** for code formatting
- **Vue ESLint** for Vue.js specific rules

Run linting and formatting before committing:

```bash
pnpm run lint:fix
pnpm run format
```

### Import Strategy

This project uses a **hybrid auto-import approach**:

- **Auto-imported**: Nuxt/Vue composables, project composables, utilities, and stores
- **Explicit imports**: Third-party libraries and external dependencies

See [IMPORTS.md](./IMPORTS.md) for detailed documentation on the import strategy.

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

### Netlify Deployment

This project is configured for easy deployment on Netlify:

#### Quick Deploy

1. **Connect Repository**
   - Fork or clone this repository to your GitHub account
   - Connect your GitHub account to Netlify
   - Create a new site from your repository

2. **Configure Build Settings**

   Netlify will automatically detect the `netlify.toml` configuration, but verify these settings:
   - **Build command**: `pnpm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18

3. **Environment Variables**

   In your Netlify dashboard, go to Site Settings > Environment Variables and add:

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Deploy**
   - Push changes to your main branch
   - Netlify will automatically build and deploy

#### Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build the project
pnpm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Alternative Deployment Options

#### Vercel

```bash
pnpm run build
```

#### Static Generation

```bash
pnpm run generate
```

### Required Environment Variables

For all deployment platforms, ensure these environment variables are set:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

### Domain Configuration

After deployment:

1. Configure your custom domain in Netlify dashboard
2. Update Supabase authentication settings with your domain
3. Update any CORS settings in your Supabase project

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
