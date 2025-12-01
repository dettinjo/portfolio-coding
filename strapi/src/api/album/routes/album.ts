// src/api/album/routes/album.ts

export default {
  routes: [
    {
      method: "GET",
      path: "/albums",
      handler: "album.find",
    },
    {
      method: "GET",
      path: "/albums/:id",
      handler: "album.findOne",
    },
    {
      method: "GET",
      path: "/albums/approve/:token",
      handler: "album.findOneByToken",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/albums/me", // The new route for authenticated users
      handler: "album.findMe",
      config: {
        auth: { scope: ["find"] }, // Requires authentication
      },
    },
    {
      method: "POST",
      path: "/albums/submit-approval/:token",
      handler: "album.submitApproval",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/albums/:id/download",
      handler: "album.downloadMyApprovedImages",
      config: {
        auth: { scope: ["find"] },
      },
    },
  ],
};
