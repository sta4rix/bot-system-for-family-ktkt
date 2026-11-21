import crypto from "crypto";

export class AppError extends Error {
  /**
   * @param {string} message
   * @param {string} [code]
   * @param {number} [statusCode]
   */
  constructor(message, code = "APP_ERROR", statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.id = crypto.randomBytes(4).toString("hex").toUpperCase();
  }
}

export function generateErrorId() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}
