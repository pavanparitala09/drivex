/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e', // We'll use a soft green or blue. Let's use blue to feel like Drive.
        },
        driveBlue: '#1a73e8', // Classic drive color
        driveLightBlue: '#e8f0fe',
        driveGray: '#f8f9fa',
        driveText: '#202124',
        driveBorder: '#dadce0'
      }
    },
  },
  plugins: [],
}
