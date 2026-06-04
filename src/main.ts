import { createApp } from "vue";
import { createPinia } from "pinia";
import { capturePostHogException, initPostHog } from "./analytics/posthog";
import App from "./App.vue";
import "./styles/globals.css";

initPostHog({
  appVersion: import.meta.env.VITE_APP_VERSION || "dev",
  host: import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com",
  hostname: window.location.hostname,
  mode: import.meta.env.MODE,
  projectToken: import.meta.env.VITE_POSTHOG_PROJECT_TOKEN || "",
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

app.config.errorHandler = (err) => {
  capturePostHogException(err);
};

app.mount("#app");
