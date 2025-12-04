export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.on("unhandledRejection", (reason, promise) => {
      if (reason === undefined) {
        // Suppress undefined rejections (often from pg-pool connection issues)
        return;
      }
      if (
        reason instanceof Error &&
        (reason.message.includes("ECONNREFUSED") ||
          reason.message.includes("cannot connect to Postgres"))
      ) {
        console.warn(
          "Suppressed unhandled rejection from DB connection failure:",
          reason.message
        );
        return;
      }
      // For other errors, let them propagate or log them
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });
  }
}
