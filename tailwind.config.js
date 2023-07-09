/* eslint-env node */
const tailwindColors = require('./node_modules/tailwindcss/colors')
const colorSafeList = []

// Skip these to avoid a load of deprecated warnings when tailwind starts up
const deprecated = ['lightBlue', 'warmGray', 'trueGray', 'coolGray', 'blueGray']

for (const colorName in tailwindColors) {
  if (deprecated.includes(colorName)) {
    continue
  }

  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

  const pallette = tailwindColors[colorName]

  if (typeof pallette === 'object') {
    shades.forEach((shade) => {
      if (shade in pallette) {
        colorSafeList.push(`text-${colorName}-${shade}`)
        colorSafeList.push(`fill-${colorName}-${shade}`)
        colorSafeList.push(`bg-${colorName}-${shade}`)
      }
    })
  }
}

/** @type {import('tailwindcss').Config} */
export default {
  safelist: [...colorSafeList, 'bg-inherit'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
 
    // Or if using `src` directory:
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {colors: tailwindColors,},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

