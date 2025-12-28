import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { createLogger, installGlobalErrorHandlers } from "./lib/logger";

const log = createLogger('main');
installGlobalErrorHandlers();
log.info('Booting application');

const rootEl = document.getElementById("root");
if (!rootEl) {
	log.error('Root element not found');
} else {
	log.debug('Rendering App into root');
	createRoot(rootEl).render(<App />);
	log.info('App rendered');
}
