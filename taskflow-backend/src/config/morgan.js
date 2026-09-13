import morgan from "morgan";
import logger from "./logger.js";

// Har HTTP request (method, URL, status, response time) automatically log hoga
const morganMiddleware = morgan("combined", {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});

export default morganMiddleware;