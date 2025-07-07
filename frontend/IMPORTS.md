# Import Strategy - Hybrid Auto-Import Approach

This project uses a hybrid approach to imports, combining Nuxt's auto-import feature with explicit imports where appropriate.

## Auto-Imported (No Import Statement Needed)

### Nuxt Composables

```javascript
// These are automatically available globally
const route = useRoute()
const router = useRouter()
const { $supabase } = useNuxtApp()
const { $toast } = useNuxtApp()
```

### Vue Composables

```javascript
// Vue 3 composables are auto-imported
const count = ref(0)
const doubled = computed(() => count.value * 2)
const { data } = await useFetch('/api/data')
```

### Project Composables

```javascript
// All files in composables/ are auto-imported
const { photos, loading } = usePhotos()
const { racers } = useRacers()
const { races } = useRaces()
const { checkins } = useCheckins()
const { brackets } = useBrackets()
const { qualifiers } = useQualifiers()
const { awards } = useAwards()
const { authStore } = useAuthStore()
```

### Project Utilities

```javascript
// All files in utils/ are auto-imported
const { formatTime } = useUtils()
const { resizeImage } = useImageResizer()
const { RACE_STATUSES } = useConstants()
```

### Stores

```javascript
// All files in stores/ are auto-imported
const authStore = useAuthStore()
```

## Explicit Imports (Import Statement Required)

### Third-Party Libraries

```javascript
// PrimeVue composables
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

// External utilities
import { debounce } from 'lodash-es'
```

### External Components

```javascript
// Components from external libraries
import { Chart } from 'chart.js'
```

## Configuration

The auto-import configuration is set in `nuxt.config.ts`:

```typescript
imports: {
  // Auto-import these directories
  dirs: [
    'composables/**',
    'utils/**',
    'stores/**'
  ],
  // Enable global imports (Vue, Nuxt composables)
  global: true
}
```

## Best Practices

### ✅ Do This

```javascript
// Auto-imported composables (no import needed)
const { photos } = usePhotos()
const route = useRoute()

// Explicit imports for third-party
import { useToast } from 'primevue/usetoast'
const toast = useToast()
```

### ❌ Don't Do This

```javascript
// Don't explicitly import auto-imported functions
import { usePhotos } from '~/composables/usePhotos' // ❌
import { useRoute } from 'vue-router' // ❌

// Don't forget to import third-party libraries
const toast = useToast() // ❌ Missing import
```

## Troubleshooting

### Linter Errors About "Undefined" Functions

If ESLint complains about functions being undefined, they might be auto-imported. Check:

1. Is it a Nuxt/Vue composable? → Auto-imported
2. Is it in `composables/`, `utils/`, or `stores/`? → Auto-imported
3. Is it from a third-party library? → Needs explicit import

### TypeScript Errors

If TypeScript can't find auto-imported functions:

1. Restart your IDE/TypeScript server
2. Run `npm run dev` to regenerate auto-imports
3. Check that the file is in the correct directory

## Migration Guide

When adding new files:

1. **Composables**: Place in `composables/` directory → Auto-imported
2. **Utilities**: Place in `utils/` directory → Auto-imported
3. **Stores**: Place in `stores/` directory → Auto-imported
4. **Third-party**: Use explicit imports

## IDE Support

### VS Code

Install the Nuxt extension for better auto-import support:

- `nuxt-vscode` extension
- `Volar` for Vue 3 support

### WebStorm/IntelliJ

- Enable Nuxt.js support in settings
- Install Vue.js plugin

## Benefits of This Approach

1. **Reduced Boilerplate**: No need to import common composables
2. **Consistency**: All project composables follow the same pattern
3. **Explicit Dependencies**: Third-party imports are clearly visible
4. **Better DX**: Less typing, more focus on business logic
5. **Tree Shaking**: Only used functions are included in the bundle
