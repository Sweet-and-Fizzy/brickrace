// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  typescript: {
    typeCheck: 'build'
  },
  modules: ['@nuxtjs/tailwindcss', '@primevue/nuxt-module', '@pinia/nuxt'],

  // Auto-import configuration
  imports: {
    // Auto-import composables and utilities
    dirs: ['composables/**', 'utils/**', 'stores/**'],
    // Global imports (Vue, Nuxt composables)
    global: true
  },

  // Netlify deployment configuration
  nitro: {
    preset: 'netlify'
  },
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark'
        }
      },
      ripple: true
    },
    components: {
      include: [
        'Select',
        'Card',
        'Button',
        'ProgressSpinner',
        'Badge',
        'DataTable',
        'Column',
        'InputText',
        'Password',
        'DatePicker',
        'FileUpload',
        'MenuBar',
        'InputNumber',
        'Textarea',
        'Checkbox',
        'Dialog',
        'Message',
        'ConfirmDialog',
        'Toast',
        'Breadcrumb',
        'Image',
        'ProgressBar',
        'Skeleton',
        'Panel',
        'Fieldset',
        'Drawer',
        'Timeline',
        'Steps',
        'Tooltip',
        'OrganizationChart',
        'Divider',
        'DataView',
        'AutoComplete',
        'Accordion',
        'AccordionPanel',
        'AccordionHeader',
        'AccordionContent',
        'InlineMessage',
        'Galleria',
        'TabMenu',
        'SplitButton',
        'Paginator'
      ]
    }
  },
  css: ['primeicons/primeicons.css', '~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY
      }
    }
  }
})
