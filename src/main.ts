import { createApp } from "vue";
import posthog from "posthog-js";
import App from "./App.vue";
import "./styles/globals.css";

posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN || "", {
  api_host: import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com",
  defaults: "2026-01-30",
  logs: {
    serviceName: "album-poster-generator-web",
    environment: import.meta.env.MODE,
    serviceVersion: import.meta.env.VITE_APP_VERSION || "dev",
  },
});

posthog.logger.info("app initialized", {
  service: "album-poster-generator",
});

const app = createApp(App);

app.config.errorHandler = (err) => {
  posthog.captureException(err);
};

app.mount("#app");
