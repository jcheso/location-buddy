require("dotenv").config();

module.exports = {
  siteMetadata: {
    siteUrl: "https://www.locationbuddy.tech",
    title: "Location Buddy",
    description: "Here to find you the perfectly placed home.",
    author: "Jarryd Cheso",
    keywords:
      "real estate, home, location, google maps, directions, renting, house, buying, flatshare",
    image: "src/images/android-chrome-512x512.png",
  },
  plugins: [
    "gatsby-plugin-image",
    {
      resolve: `gatsby-plugin-google-adsense`,
      options: {
        publisherId: `ca-pub-4440017294340120`,
      },
    },
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
        background_color: "#f56565",
        theme_color: "#dcdee2",
        display: "standalone",
        icon: "src/assets/images/smile-icon-2.png", // This path is relative to the root of the site.
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
