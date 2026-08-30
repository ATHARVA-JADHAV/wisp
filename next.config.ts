import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // widget.js runs on the CUSTOMER's page, so its fetch of the appearance
        // config is cross-origin. Without this header the browser blocks it —
        // and because the call is wrapped in a silent .catch(), the failure was
        // invisible: the launcher button just never picked up the project's
        // accent colour on any real third-party site. (The chat itself was
        // unaffected — it runs inside the iframe, same-origin with the API.)
        //
        // "*" is correct here: this endpoint is public by design and returns
        // only bot_name, greeting and accent_color for a public project key.
        source: "/api/widget-config",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
        ],
      },
    ];
  },
};

export default nextConfig;
