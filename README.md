# The Great Holyoke Brick Race 🏁

A modern web application for managing The Great Holyoke Brick Race - where performance art meets sport in the first brick race of its kind. This comprehensive platform supports race management, participant registration, photo galleries, awards tracking, and community engagement.

## Overview

The Great Holyoke Brick Race is a unique gravity-powered vehicle racing event that combines creativity, engineering, and artistic expression. Started by local artists in 2010, it has become the first brick race of its kind in the country, celebrating both speed and artistry in custom-built racing vehicles.

This application provides a complete digital platform for the racing community, from registration and race management to photo sharing and awards ceremonies.

## Features

### Public Features
- **Race Information**: Current and historical race details with live countdown timers
- **Photo Galleries**: Community-submitted photos with moderation and featured image system
- **Racer Profiles**: Showcase of creative vehicles and their builders
- **Awards System**: Public display of race results and award winners
- **Real-time Updates**: Live countdown timers and race day information
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Admin Features
- **Race Management**: Create and manage racing events with detailed configuration
- **Photo Moderation**: Review, approve, and feature user-submitted photos
- **Awards Management**: Create award categories and assign winners
- **User Management**: Handle participant accounts and permissions
- **Dashboard**: Comprehensive admin interface with statistics and quick actions

### User Features
- **Account Registration**: Secure user authentication with role-based access
- **Racer Registration**: Submit vehicle entries for upcoming races
- **Photo Uploads**: Share photos from races and community events
- **Profile Management**: Track personal racing history and achievements

## Technology Stack

### Frontend
- **Nuxt 3** - Vue.js framework with server-side rendering
- **PrimeVue** - Comprehensive Vue.js component library
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Pinia** - Vue.js state management
- **Supabase** - Backend-as-a-service with PostgreSQL database
- **PrimeIcons** - Icon library for consistent UI elements

### Backend & Database
- **Supabase** - PostgreSQL database with real-time capabilities
- **Supabase Auth** - User authentication and authorization
- **Supabase Storage** - File uploads and media management
- **Row Level Security** - Database-level security policies

### Design & Typography
- **Righteous** - Bold display font for headers and branding
- **Inter** - Clean body font for readability
- **Brand Color Scheme** - Red-orange gradient reflecting the brick race theme
- **DIY/Maker Aesthetic** - Clean, industrial design elements

## Brand Guidelines

### Color Palette

#### Primary Colors (Brick Race Brand)
- **Primary Red**: `#dc2626` (red-600) - Main brand color, primary buttons
- **Primary Orange**: `#ea580c` (orange-600) - Secondary brand color, accent elements
- **Gradient Background**: `from-red-50 via-orange-50 to-yellow-50` - Light mode page backgrounds
- **Dark Gradient**: `from-gray-900 via-gray-800 to-gray-900` - Dark mode page backgrounds

#### Secondary Colors
- **Brick Red**: `#b91c1c` (red-700) - Darker brand accents
- **Orange Accent**: `#fb923c` (orange-400) - Hover states, highlights
- **Yellow Accent**: `#fbbf24` (yellow-400) - Completion states, success indicators

#### Tertiary Colors
- **Dark Green**: `#166534` (green-800) - Call-to-action elements, special features
- **Success Green**: `#16a34a` (green-600) - Success states, positive actions
- **Info Blue**: `#2563eb` (blue-600) - Information, neutral actions

#### Neutral Colors
- **Text Dark**: `#111827` (gray-900) - Primary text in light mode
- **Text Light**: `#ffffff` (white) - Primary text in dark mode
- **Text Muted**: `#6b7280` (gray-500) - Secondary text
- **Border**: `#d1d5db` (gray-300) - Light borders and dividers

### Color Usage Guidelines

#### Backgrounds
- **Page Backgrounds**: Always use the brand gradient (`from-red-50 via-orange-50 to-yellow-50`)
- **Card Backgrounds**: White/gray-800 for contrast against gradient
- **Hero Sections**: Can use solid red gradients for special emphasis

#### Buttons
- **Primary Actions**: `.btn-brick` class (red-orange gradient)
- **Secondary Actions**: `.btn-brick-secondary` class (yellow brick style)
- **Tertiary Actions**: Dark green for special CTAs (homepage)
- **Neutral Actions**: Standard PrimeVue button styles

#### Interactive Elements
- **Links**: Blue-600 for information, red-600 for brand-related
- **Hover States**: Darker versions of base colors
- **Active States**: Even darker versions with pressed effects

#### Status Indicators
- **Success**: Green variants
- **Warning**: Yellow/orange variants
- **Error**: Red variants (but not brand red to avoid confusion)
- **Info**: Blue variants

### Typography

#### Font Families
- **Display Font**: `'Righteous', sans-serif` - Headers, titles, branding
- **Body Font**: `'Inter', sans-serif` - All body text, UI elements

#### Font Weights
- **Righteous**: 400 (only weight available)
- **Inter**: 300, 400, 500, 600, 700 (use 400 for body, 600+ for emphasis)

### Component Styling

#### Cards
- Use white/gray-800 backgrounds for contrast
- Subtle shadows for depth
- Brand-colored borders for emphasis

#### Navigation
- Transparent breadcrumbs using pass-through API
- Brand gradient backgrounds throughout

#### Forms
- Consistent with PrimeVue theme
- Brand-colored focus states
- Error states use non-brand red to avoid confusion

## Project Structure

```
brickrace/
├── frontend/              # Nuxt 3 Vue.js application
│   ├── assets/           # Static assets (CSS, images)
│   ├── components/       # Reusable Vue components
│   ├── composables/      # Vue composables for shared logic
│   ├── layouts/          # Application layouts
│   ├── middleware/       # Route middleware (auth, admin)
│   ├── pages/            # File-based routing pages
│   ├── plugins/          # Nuxt plugins
│   ├── stores/           # Pinia state stores
│   └── types/            # TypeScript type definitions
└── README.md             # This file
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm package manager
- Supabase account for database hosting

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brickrace
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

3. **Environment Configuration**
   Create `.env` file in the frontend directory:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

## Database Schema

The application uses Supabase PostgreSQL with the following core tables:

### Core Tables
- **`races`** - Racing events and configuration
- **`racers`** - Participant vehicles and registration data
- **`checkins`** - Race day attendance tracking
- **`awards`** - Award categories and definitions
- **`award_winners`** - Award assignments to participants
- **`general_photos`** - Community photo uploads with moderation
- **`users`** - Authentication and user profile data

### Key Features
- **Row Level Security (RLS)** for data protection
- **Featured photo system** for hero backgrounds
- **Admin role hierarchy** (User → Race Admin → Admin)
- **Photo moderation workflow** with approval status
- **Real-time subscriptions** for live updates

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run generate     # Generate static site
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

### Code Quality
- **ESLint** with Nuxt 3 configuration
- **Prettier** for consistent formatting
- **Vue ESLint** for Vue.js specific rules
- **TypeScript** support for type safety

### Development Workflow
1. Run code quality tools before committing:
   ```bash
   npm run lint:fix && npm run format
   ```
2. Test functionality across different screen sizes
3. Verify authentication and authorization flows
4. Check error handling and edge cases

## Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Static assets optimized
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] SSL certificates installed
- [ ] CDN configured for media files

### Build Commands
```bash
npm run build      # Production build
npm run generate   # Static site generation
```

## User Roles & Permissions

### User Hierarchy
1. **User** - Basic participants
   - Register vehicles for races
   - Upload photos (requires approval)
   - View public content

2. **Race Admin** - Event organizers
   - All User permissions
   - Create and manage races
   - Approve photos and moderate content
   - Assign awards and manage results

3. **Admin** - System administrators
   - All Race Admin permissions
   - Manage user accounts and permissions
   - Access system configuration
   - View comprehensive analytics

## Community & Events

### The Great Holyoke Brick Race
- **Founded**: 2010 by local artists
- **Location**: Holyoke, Massachusetts
- **Frequency**: Annual racing events
- **Categories**: Speed, Creativity, Artistry, and more
- **Community**: Artists, engineers, tinkerers, and dreamers of all ages

### Event Features
- **Gravity-powered vehicles** built by participants
- **Creative expression** combined with engineering
- **Awards ceremonies** celebrating both speed and artistry
- **Community gathering** fostering maker spirit
- **Photo documentation** preserving racing history

## Contributing

We welcome contributions from the racing community and developers!

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper testing
4. Run code quality tools: `npm run lint:fix && npm run format`
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow the established code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Ensure responsive design compatibility
- Test across different browsers and devices

## Support & Documentation

### Resources
- [Frontend Documentation](./frontend/README.md) - Detailed technical documentation
- [Development Guide](./frontend/DEVELOPMENT.md) - Development practices and standards
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PrimeVue Components](https://primevue.org/)

### Getting Help
- Review existing documentation
- Check GitHub issues for similar problems
- Create detailed issue reports with reproduction steps
- Join community discussions

## License

This project is part of The Great Holyoke Brick Race community event. Built with ❤️ for the creative racing community.

---

**Ready to race?** Join the creative chaos and build your own gravity-powered masterpiece! 🏎️✨