require("dotenv").config();

module.exports = {
  siteMetadata: {
    siteUrl: "https://www.locationbuddy.tech",
    title: "Location Buddy",
    description: "We help you find the perfectly located home",
    author: "Jarryd Cheso",
    keywords: "real estate, home, location, google maps",
    image: "src/images/icon.png",
  },
  plugins: [
    "gatsby-plugin-image",
    {
      resolve: `gatsby-plugin-google-gtag`,
      options: {
        trackingIds: [
          "G-QCCVZVPHK0", // Google Analytics / GA
        ],

        gtagConfig: {
          optimize_id: "OPT_CONTAINER_ID",
          anonymize_ip: true,
          cookie_expires: 0,
        },
        pluginConfig: {
          head: true,
        },
      },
    },
    "gatsby-plugin-react-helmet",
    "gatsby-plugin-sitemap",
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: "Location Buddy",
        short_name: "Location Buddy",
        start_url: "/",
        background_color: "#90BEDE",
        theme_color: "#334A5A",
        display: "standalone",
        icon: "src/assets/images/logo.png", // This path is relative to the root of the site.
      },
    },
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "images",
        path: `${__dirname}/src/assets/images/`,
      },
      __key: "images",
    },
    "gatsby-plugin-postcss",
  ],
};
