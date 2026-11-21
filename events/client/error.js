import { logger } from "../../utils/logger.js";

export default {
  name: "error",
  once: false,
  /**
   * @param {Error} error
   */
  async execute(error) {
    logger.error({ err: error }, "Discord client encountered an error");
  }
};
