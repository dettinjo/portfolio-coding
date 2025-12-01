// src/api/auth/routes/auth.js
module.exports = {
  routes: [
    {
      method: "GET",
      path: "/connect/google/callback", // We are explicitly overriding this path
      handler: "auth.googleCallback",
      config: {
        auth: false, // This route must be public for Google to redirect to it
      },
    },
  ],
};
