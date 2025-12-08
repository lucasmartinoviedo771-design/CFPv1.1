/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: '#0a0033', // Deep purple/blue background
                    primary: '#1a0b5c', // Lighter purple for cards
                    accent: '#FF6600', // The orange "3" color
                    cyan: '#00ccff', // The cyan line color
                    purple: '#aa00ff', // The purple line color
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            backgroundImage: {
                'hero-gradient': 'linear-gradient(135deg, #0a0033 0%, #1a0044 100%)',
                'glass': 'rgba(255, 255, 255, 0.05)',
            }
        },
    },
    plugins: [],
}
