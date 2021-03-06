require("dotenv").config();

module.exports = {
  siteMetadata: {
    siteUrl: "https://www.locationbuddy.tech",
    title: "",
    description: "Here to find you the perfectly located home.",
    author: "Jarryd Cheso",
    keywords:
      "real estate, home, location, google maps, directions, renting, house, buying, flatshare, places, commuting,",
    image: "src/assets/images/smile-icon-2.png",
  },
  plugins: [
    "gatsby-plugin-image",
    {
      resolve: "gatsby-plugin-robots-txt",
      options: {
        host: "https://www.locationbuddy.tech/",
        sitemap: "https://www.locationbuddy.tech/sitemap/sitemap-index.xml",
        policy: [{ userAgent: "*", allow: "/" }],
      },
    },
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
          anonymize_ip: false,
          cookie_expires: 0,
        },
        pluginConfig: {
          head: true,
          respectDNT: false,
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
    "gatsby-plugin-offline",
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
