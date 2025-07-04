# Development Guide

This document outlines development practices, coding standards, and guidelines for The Great Holyoke Brick Race application.

## Development Setup

### Prerequisites

- Node.js 18 or later
- npm or pnpm package manager
- Git version control
- Supabase account for database access

### Initial Setup

1. Clone the repository and install dependencies
2. Set up environment variables (see README.md)
3. Run the development server: `npm run dev`
4. Access the application at `http://localhost:3000`

## Code Quality Standards

### Linting and Formatting

The project uses ESLint and Prettier for code quality:

- **ESLint**: Configured with Nuxt 3 standards and Vue.js best practices
- **Prettier**: Enforces consistent code formatting
- **Vue ESLint**: Specific rules for Vue.js components

#### Running Code Quality Tools

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changing files
npm run format:check
```

### Pre-commit Workflow

Before committing code:

1. Run `npm run lint:fix` to fix linting issues
2. Run `npm run format` to format code consistently
3. Test the application to ensure functionality
4. Commit with descriptive messages

## Vue.js/Nuxt 3 Best Practices

### Component Structure

```vue
<template>
  <!-- Template code with proper indentation -->
</template>

<script setup>
// Imports first
import { ref, computed, onMounted } from 'vue'

// Props and emits
const props = defineProps({
  // prop definitions
})

// Reactive state
const state = ref(initialValue)

// Computed properties
const computedValue = computed(() => {
  // computation logic
})

// Methods
const handleAction = () => {
  // method logic
}

// Lifecycle hooks
onMounted(() => {
  // initialization logic
})
</script>
```

### Naming Conventions

- **Components**: PascalCase (e.g., `PhotoGallery.vue`)
- **Props**: camelCase (e.g., `imageUrl`)
- **Events**: kebab-case (e.g., `photo-selected`)
- **Variables**: camelCase (e.g., `activeRace`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `API_BASE_URL`)

### State Management

- Use Pinia for global state management
- Keep component state local when possible
- Use composables for shared reactive logic

## Database Integration

### Supabase Best Practices

- Always handle errors from Supabase queries
- Use TypeScript types for database schemas
- Implement proper authentication checks
- Use RLS (Row Level Security) policies

### Example Query Pattern

```javascript
try {
  const { data, error } = await $supabase
    .from('table_name')
    .select('columns')
    .eq('filter_column', value)

  if (error) throw error

  // Handle successful data
  return data
} catch (error) {
  console.error('Database query failed:', error)
  // Handle error appropriately
}
```

## UI/UX Guidelines

### Design System

- **Colors**: Red primary theme reflecting brick race branding
- **Typography**: Bebas Neue for headers, system fonts for body text
- **Spacing**: Use Tailwind CSS spacing scale consistently
- **Components**: Utilize PrimeVue components for consistency

### Responsive Design

- Mobile-first approach using Tailwind CSS
- Test on various screen sizes
- Ensure touch-friendly interfaces on mobile

### Accessibility

- Use semantic HTML elements
- Provide alt text for images
- Ensure keyboard navigation works
- Maintain sufficient color contrast

## File Organization

### Directory Structure

```
components/
├── ui/                 # Reusable UI components
├── forms/             # Form-specific components
└── layout/            # Layout-related components

pages/
├── admin/             # Admin-only pages
├── races/             # Race-related pages
└── [other-sections]/  # Feature-specific pages

composables/
├── useAuth.js         # Authentication logic
├── useApi.js          # API interaction helpers
└── [feature].js      # Feature-specific composables

stores/
├── auth.js            # Authentication state
├── races.js           # Race data state
└── [feature].js      # Feature-specific state
```

### Import Organization

```javascript
// 1. Vue/Nuxt imports
import { ref, computed } from 'vue'

// 2. Third-party imports
import { useToast } from 'primevue/usetoast'

// 3. Internal imports (composables, stores, utils)
import { useAuthStore } from '~/stores/auth'

// 4. Component imports
import PhotoGallery from '~/components/PhotoGallery.vue'
```

## Testing Guidelines

### Manual Testing

- Test all user flows before committing
- Verify responsive design on multiple devices
- Check authentication and authorization flows
- Test error handling and edge cases

### Browser Compatibility

- Primary: Chrome, Firefox, Safari, Edge (latest versions)
- Mobile: iOS Safari, Chrome on Android
- Test JavaScript functionality across browsers

## Security Considerations

### Authentication & Authorization

- Always verify user permissions on sensitive operations
- Use middleware for route protection
- Never expose sensitive data in client-side code
- Implement proper session management

### Data Handling

- Validate all user inputs
- Sanitize data before database operations
- Use Supabase RLS for database security
- Handle file uploads securely

## Performance Best Practices

### Bundle Optimization

- Use dynamic imports for large components
- Optimize images and assets
- Minimize bundle size with tree shaking
- Use Nuxt's built-in optimization features

### Runtime Performance

- Implement virtual scrolling for large lists
- Use computed properties for expensive calculations
- Optimize re-renders with proper key usage
- Cache API responses when appropriate

## Deployment Checklist

### Pre-deployment

- [ ] Run full test suite
- [ ] Check for console errors/warnings
- [ ] Verify environment variables are set
- [ ] Test authentication flows
- [ ] Verify database connections
- [ ] Check responsive design
- [ ] Validate SEO meta tags

### Production Considerations

- Use environment-specific configuration
- Enable proper logging and monitoring
- Implement error tracking
- Set up backup strategies
- Configure CDN for static assets

## Common Issues and Solutions

### Development Issues

- **ESLint errors**: Run `npm run lint:fix` to auto-fix
- **Import errors**: Check file paths and ensure exports exist
- **Supabase connection**: Verify environment variables
- **Build failures**: Clear `.nuxt` cache and reinstall dependencies

### Debugging Tips

- Use Vue DevTools for component inspection
- Check browser network tab for API issues
- Use console.log strategically (remove before commit)
- Utilize Nuxt DevTools for development insights

## Contributing Guidelines

### Code Review Process

1. Create feature branch from main
2. Implement changes with proper testing
3. Ensure code quality standards are met
4. Submit pull request with clear description
5. Address review feedback promptly

### Commit Message Format

```
type(scope): description

Examples:
feat(auth): add user registration form
fix(gallery): resolve image loading issue
docs(readme): update installation instructions
style(format): fix code formatting
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## Resources

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Vue.js Guide](https://vuejs.org/guide/)
- [PrimeVue Components](https://primevue.org/)
- [Tailwind CSS Utilities](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
