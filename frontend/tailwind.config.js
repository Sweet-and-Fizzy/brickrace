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
    extend: {
      colors: {
        'brand-blue': '#175bd3',
        'brand-green': '#1e6863',
        'brand-gold': '#ffc927'
      },
      fontFamily: {
        display: ['Impact', 'sans-serif'],
        body: ['Open Sans', 'sans-serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class' // Only apply to elements with 'form-input' class
    })
  ]
}
