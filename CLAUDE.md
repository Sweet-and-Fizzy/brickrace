# BrickRace Project Documentation for Claude

## Project Overview
The Great Holyoke Brick Race - A Nuxt 3 web application for managing gravity-powered vehicle racing events, combining performance art and sport. Features race management, participant registration, photo galleries, awards tracking, and community engagement.

## Tech Stack
- **Frontend**: Nuxt 3, Vue 3, PrimeVue, Tailwind CSS, Pinia
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deployment**: Netlify
- **Package Manager**: pnpm/npm

## Key Commands
```bash
# Development
cd frontend
npm run dev          # Start dev server on localhost:3000
npm run build        # Build for production
npm run generate     # Generate static site
npm run preview      # Preview production build

# Code Quality (ALWAYS run before committing)
npm run lint         # Check for linting issues
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
```

## Project Structure
```
brickrace/
├── frontend/              # Main Nuxt 3 application
│   ├── assets/           # CSS, images
│   ├── components/       # Vue components
│   ├── composables/      # Shared logic hooks
│   ├── layouts/          # Page layouts
│   ├── middleware/       # Auth & admin middleware
│   ├── pages/            # File-based routing
│   ├── plugins/          # Nuxt plugins
│   ├── server/           # Server API endpoints
│   │   ├── api/         # API routes
│   │   └── utils/       # Server utilities
│   ├── stores/          # Pinia stores
│   ├── types/           # TypeScript types
│   └── utils/           # Client utilities
├── supabase/            # Database migrations
└── archive/             # Old code references
```

## Key Features & Pages

### Public Pages
- `/` - Homepage with race countdown
- `/races` - All races listing
- `/races/[slug]` - Individual race details
- `/racers` - All racers listing
- `/racers/[slug]` - Individual racer profile
- `/gallery` - Photo gallery
- `/awards` - Awards display
- `/heats` - Heat schedule
- `/faq` - FAQ page
- `/our-story` - About page

### User Features (Auth Required)
- `/my-racers` - Manage user's racers
- `/my-photos` - User's uploaded photos
- `/races/[slug]/my-status` - Check-in status

### Admin Features
- `/admin` - Admin dashboard
- `/admin/photos` - Photo moderation
- `/admin/heats` - Heat management
- `/races/[slug]/edit` - Edit race
- `/races/[slug]/checkin` - Check-in management
- `/races/[slug]/qualifiers` - Qualifier management
- `/races/[slug]/brackets` - Bracket management
- `/awards/manage` - Awards management

## Database Schema (Key Tables)
- `races` - Racing events
- `racers` - Participants/vehicles
- `checkins` - Race day attendance
- `qualifiers` - Qualifying rounds
- `brackets` - Elimination brackets
- `awards` - Award categories
- `award_winners` - Award assignments
- `general_photos` - Photo uploads
- `heats` - Race heats

## Authentication & Roles
1. **User** - Basic participant (register racers, upload photos)
2. **Race Admin** - Event organizer (manage races, moderate content)
3. **Admin** - System admin (full access)

## Development Guidelines

### Before Starting Work
1. Check current git status
2. Pull latest changes
3. Review any existing TODOs

### Component Patterns
- Use PrimeVue components when available
- Follow existing composable patterns
- Maintain consistent styling with Tailwind classes
- Use brand colors (blue: #175bd3, green: #1e6863, gold: #ffc927)

### Common Composables
- `useAuth()` - Authentication state
- `useRaces()` - Race management
- `useRacers()` - Racer management
- `usePhotos()` - Photo handling
- `useNotifications()` - User notifications
- `useGlobalLoading()` - Loading states

### API Endpoints Pattern
Server API routes in `frontend/server/api/`:
- Use TypeScript
- Validate with Supabase auth
- Follow RESTful conventions
- Handle errors gracefully

### Styling Guidelines

#### Brand Colors
- **Primary Blue**: `#175bd3` (--brand-blue)
- **Primary Green**: `#1e6863` (--brand-green)  
- **Primary Gold**: `#ffc927` (--brand-gold)

#### Typography
- **Headers (h1, h2)**: Impact font
- **Headers (h3-h6)**: Open Sans (600 weight)
- **Body text**: Open Sans (400 weight)
- Site name: Open Sans (700 weight)

#### Button Classes
- **Primary button**: `btn-primary` - Black parallelogram with white text (inverts in dark mode)
- **Secondary button**: `btn-secondary` - Outline parallelogram
- Buttons use skewed transform for parallelogram effect
- NO brick-themed button classes

#### Card Styling
- Cards have black borders (2px solid)
- No border radius (sharp corners)
- Hover adds shadow effect
- Dark mode: gray-800 background with gray-700 borders

#### Dark Mode
- Automatic color inversions for buttons
- PrimeVue components use CSS variables for theming
- Text colors adjust for readability
- Background gradients adapt to dark theme

## Environment Variables
Required in `frontend/.env`:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## Common Tasks

### Adding a New Page
1. Create file in `frontend/pages/`
2. Add navigation if needed
3. Follow existing page patterns
4. Test auth requirements

### Modifying Database
1. Create migration in `supabase/migrations/`
2. Update TypeScript types
3. Update affected composables
4. Test RLS policies

### Deploying Changes
1. Run linting and formatting
2. Test locally
3. Build production version
4. Push to main branch (auto-deploys to Netlify)

## Current Focus Areas
- Race timing system
- Photo moderation workflow
- Award voting system
- Real-time updates
- Performance optimization

## Known Issues & TODOs
- Check `/frontend/TODO.md` if exists
- Review recent commits for context
- Check GitHub issues

## Testing Approach
- Manual testing for UI/UX
- Test across different screen sizes
- Verify auth flows
- Check Supabase RLS policies
- Test with different user roles

## Important Notes
- Always preserve existing code style
- Don't create unnecessary files
- Prefer editing over creating new files
- Run lint/format before committing
- Test auth and permissions thoroughly
- Brand consistency is important (brick race theme)