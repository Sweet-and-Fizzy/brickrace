// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  typescript: {
    typeCheck: 'build'
  },
  modules: ['@nuxtjs/tailwindcss', '@primevue/nuxt-module', '@pinia/nuxt', '@nuxtjs/supabase'],

  // Auto-import configuration
  imports: {
    // Auto-import composables and utilities
    dirs: ['composables/**', 'utils/**', 'stores/**'],
    // Global imports (Vue, Nuxt composables)
    global: true
  },

  // Router configuration for scroll behavior
  router: {
    options: {
      scrollBehaviorType: 'smooth'
    }
  },

  // App configuration for SEO and meta tags
  app: {
    head: {
      titleTemplate: '%s | The Great Holyoke Brick Race',
      title: 'Home',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' },

        // Primary Meta Tags
        {
          name: 'description',
          content:
            'The first brick race of its kind in the country. Design and build gravity-powered brick racers to compete for speed, creativity, and artistry in Holyoke, Massachusetts.'
        },
        {
          name: 'keywords',
          content:
            'brick race, holyoke, massachusetts, gravity racing, creative competition, community event, brick racer, art, engineering'
        },
        { name: 'author', content: 'The Great Holyoke Brick Race' },

        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://thegreatholyokebrickrace.com/' },
        { property: 'og:title', content: 'The Great Holyoke Brick Race' },
        {
          property: 'og:description',
          content:
            'Where performance art meets sport. Join our creative community of builders racing gravity-powered brick vehicles down an inclined track!'
        },
        { property: 'og:image', content: '/og-image.jpg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:site_name', content: 'The Great Holyoke Brick Race' },

        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:url', content: 'https://thegreatholyokebrickrace.com/' },
        { name: 'twitter:title', content: 'The Great Holyoke Brick Race' },
        {
          name: 'twitter:description',
          content:
            'Where performance art meets sport. Join our creative community of builders racing gravity-powered brick vehicles!'
        },
        { name: 'twitter:image', content: '/og-image.jpg' },

        // Additional SEO
        { name: 'robots', content: 'index, follow' },
        {
          name: 'googlebot',
          content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
        },
        { name: 'theme-color', content: '#175bd3' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://thegreatholyokebrickrace.com' }
      ]
    }
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
  css: ['primeicons/primeicons.css', '~/assets/css/main.css', '~/assets/css/button-overrides.css'],
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    redirect: false
  },
  runtimeConfig: {
    public: {
      supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY
      }
    }
  }
})
