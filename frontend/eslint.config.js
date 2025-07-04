import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: false
  }
})
  .override('nuxt/vue/rules', {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'never',
            normal: 'always',
            component: 'always'
          },
          svg: 'always',
          math: 'always'
        }
      ],
      // Allow unused vars in template destructuring
      'vue/no-unused-vars': [
        'error',
        {
          ignorePattern: '^_'
        }
      ]
    }
  })
  .override('nuxt/javascript', {
    languageOptions: {
      globals: {
        // Nuxt auto-imports
        navigateTo: 'readonly',
        useNuxtApp: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        useHead: 'readonly',
        useToast: 'readonly',
        useDarkMode: 'readonly',
        createError: 'readonly',
        definePageMeta: 'readonly',
        defineNuxtPlugin: 'readonly',
        defineNuxtRouteMiddleware: 'readonly',
        defineNuxtConfig: 'readonly',
        useRuntimeConfig: 'readonly',
        readonly: 'readonly',
        // Browser globals
        console: 'readonly',
        localStorage: 'readonly',
        window: 'readonly',
        document: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        confirm: 'readonly',
        FileReader: 'readonly',
        Image: 'readonly',
        // Node.js globals
        process: 'readonly',
        require: 'readonly'
      }
    },
    rules: {
      // Allow unused vars in certain patterns (e.g., destructuring)
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_'
        }
      ],
      // Disable the prefer-number-properties rule for parseFloat/isNaN
      'unicorn/prefer-number-properties': 'off'
    }
  })
