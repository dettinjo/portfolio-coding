// src/api/auth/controllers/auth.js
"use strict";

const { sanitize } = require("@strapi/utils");

module.exports = {
  async googleCallback(ctx) {
    const { query } = ctx.request;

    // The 'grant' provider middleware should have already processed the request
    // and attached the JWT and user info to the query string.
    const jwt = query.jwt;
    const user = query.user;

    const validLocales = ["en", "de"];
    const defaultLocale = "en";
    let locale = query.locale || defaultLocale;

    // Sanitize the locale to ensure it's one of the valid ones
    if (!validLocales.includes(locale)) {
      strapi.log.warn(
        `[Google Callback] Invalid locale provided: "${locale}". Falling back to "${defaultLocale}".`
      );
      locale = defaultLocale;
    }

    strapi.log.info(`[Google Callback] Received callback. JWT found: ${!!jwt}`);

    // This is the absolute URL of your frontend application
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      strapi.log.error(
        "[Google Callback] FRONTEND_URL is not set in environment variables."
      );
      return ctx.internalServerError(
        "Application is not configured correctly."
      );
    }

    if (!jwt) {
      strapi.log.warn(
        "[Google Callback] No JWT found in the callback query. Redirecting to login with error."
      );
      // Redirect back to the frontend login page with an error
      return ctx.redirect(`${frontendUrl}/login?error=authentication_failed`);
    }

    try {
      // Construct the final redirect URL to your frontend's callback handler
      const redirectUrl = new URL(`${frontendUrl}/connect/google/callback`);
      redirectUrl.searchParams.set("access_token", jwt);

      strapi.log.info(
        `[Google Callback] Successfully prepared redirect to: ${redirectUrl.href}`
      );

      // Manually and explicitly redirect to the frontend
      ctx.redirect(redirectUrl.href);
    } catch (error) {
      strapi.log.error(
        "[Google Callback] Failed to construct redirect URL or perform redirect:",
        error
      );
      return ctx.internalServerError(
        "An unexpected error occurred during the login process."
      );
    }
  },
};
