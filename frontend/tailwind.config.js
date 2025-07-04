/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    './app.vue'
  ],
  darkMode: ['class', '.app-dark'],
  theme: {
    extend: {}
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class' // Only apply to elements with 'form-input' class
    })
  ]
}
