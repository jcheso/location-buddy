module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        "primary-100": "",
        "primary-200": "",
        "primary-300": "#3C64B1",
        "secondary-100": "#F4F5F4",
        "secondary-200": "",

        "secondary-300": "",
        "tertiary-100": "#DCDEE2",
        "tertiary-200": "#E5E5E5",
        "tertiary-300": "#E8E8E8",
        "typography-100": "",
        "typography-200": "#737B7D",
        "typography-300": "#373F41",
      },
      fontFamily: {
        Mulish: ["Mulish", "sans-serif"],
      },
    },
  },
  variants: {
    extend: { backgroundColor: ["active"], backgroundOpacity: ["active"] },
  },
  plugins: [],
};
