// src/api/album/controllers/album.ts

import { factories } from "@strapi/strapi";
import { clientConfirmationTemplates } from "../../../utils/emailTemplates";

// Helper function to create a URL-safe string
const sanitizeFilename = (str: string): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-.]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

export default factories.createCoreController(
  "api::album.album",
  ({ strapi }) => ({
    /**
     * CUSTOM: Find albums for the currently logged-in user.
     */
    /**
     * Custom controller to fetch albums for the currently authenticated user.
     */
    async findMe(ctx) {
      // The user object is injected by the auth middleware
      const user = ctx.state.customer;

      if (!user) {
        return ctx.unauthorized("You must be logged in to view your albums.");
      }

      strapi.log.info(`Fetching albums for user ID: ${user.id}`);

      const entities = await strapi.entityService.findMany("api::album.album", {
        filters: { customer: { id: user.id } },
        populate: ["images", "coverImage", "testimonials"],
      });

      if (!entities) {
        return ctx.notFound("No albums found for this user.");
      }

      const sanitizedEntities = await this.sanitizeOutput(entities, ctx);
      return this.transformResponse(sanitizedEntities);
    },

    /**
     * CUSTOM: Find a single album, ensuring it belongs to the logged-in user.
     */
    async findOne(ctx) {
      const { user } = ctx.state;
      const { id } = ctx.params;

      if (!user) {
        return ctx.unauthorized("You must be logged in to view this album.");
      }

      // Fetch the album and populate the customer relation
      const album = await strapi.db.query("api::album.album").findOne({
        where: { id },
        populate: ["customer"],
      });

      if (!album) {
        return ctx.notFound("Album not found.");
      }

      // Check if the album's customer ID matches the logged-in user's ID
      if (!album.customer || album.customer.id !== user.id) {
        return ctx.forbidden("You don't have permission to access this album.");
      }

      // Now that we've verified ownership, call the original findOne to get the sanitized data.
      const sanitizedEntity = await super.findOne(ctx);

      return sanitizedEntity;
    },

    /**
     * Custom controller to fetch a single album by its unique approvalToken.
     */
    async findOneByToken(ctx) {
      const { token } = ctx.params;
      strapi.log.info(`Attempting to find album by approval token: ${token}`);

      if (!token) {
        return ctx.badRequest("Token is required.");
      }

      // Populate the testimonials relation to check if one already exists
      const entity = await strapi.db.query("api::album.album").findOne({
        where: { approvalToken: token, approvalRequired: true },
        populate: ["images", "coverImage", "testimonials"],
      });

      if (!entity) {
        strapi.log.warn(`No album found for token: ${token}`);
        return ctx.notFound("Album not found or does not require approval.");
      }

      strapi.log.info(
        `Successfully found album "${entity.title}" (ID: ${entity.id}) for token.`
      );
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    },

    /**
     * Custom controller to handle the submission of client approvals.
     */
    async submitApproval(ctx) {
      const { token } = ctx.params;
      const { imageApprovals, consentGiven } = ctx.request.body;
      strapi.log.info(`Approval submission received for token: ${token}`);

      if (!token) {
        return ctx.badRequest("Token is required.");
      }

      const album = await strapi.db.query("api::album.album").findOne({
        where: { approvalToken: token, approvalRequired: true },
      });

      if (!album) {
        strapi.log.warn(`No album found for token during submission: ${token}`);
        return ctx.notFound("Album not found.");
      }

      if (
        album.approvalStatus === "Submitted" ||
        album.approvalStatus === "Approved"
      ) {
        strapi.log.warn(
          `Attempted to re-submit approval for already submitted album ID: ${album.id}`
        );
        return ctx.forbidden(
          "This gallery has already been submitted for approval."
        );
      }

      const selectedCount = imageApprovals.filter(
        (img) => img.approved === true
      ).length;

      if (album.selectionMin && selectedCount < album.selectionMin) {
        return ctx.badRequest(
          `A minimum of ${album.selectionMin} images is required.`
        );
      }

      if (album.selectionMax && selectedCount > album.selectionMax) {
        return ctx.badRequest(
          `A maximum of ${album.selectionMax} images can be selected.`
        );
      }

      if (selectedCount > 0 && !consentGiven) {
        return ctx.badRequest(
          "Consent is required to approve images for publication."
        );
      }

      try {
        strapi.log.info(`Updating album ID: ${album.id} with approval data.`);
        const updatedAlbum = await strapi.entityService.update(
          "api::album.album",
          album.id,
          {
            data: {
              imageApprovals: imageApprovals || [],
              publicationConsent: consentGiven || false,
              approvalStatus: "Submitted",
            },
          }
        );

        strapi.log.info(
          `✅ Album ID: ${album.id} successfully updated to "Submitted" status.`
        );

        if (updatedAlbum.clientEmail) {
          strapi.log.info(
            `Client email found. Sending confirmation to: ${updatedAlbum.clientEmail}`
          );

          const photographerName =
            process.env.NEXT_PUBLIC_FULL_NAME || "Your Photographer";
          const templateFunction =
            clientConfirmationTemplates[updatedAlbum.locale] ||
            clientConfirmationTemplates.en;

          const emailContent = templateFunction({
            clientName: updatedAlbum.clientName || "Client",
            albumTitle: updatedAlbum.title,
            selectedCount,
            photographerName,
          });

          try {
            await strapi.plugin("email").service("email").send({
              to: updatedAlbum.clientEmail,
              subject: emailContent.subject,
              html: emailContent.html,
            });
            strapi.log.info(
              `✅ Client confirmation email sent successfully in '${updatedAlbum.locale}'.`
            );
          } catch (err) {
            strapi.log.error("Failed to send client confirmation email:", err);
          }
        }

        return this.transformResponse(updatedAlbum);
      } catch (error) {
        strapi.log.error("Error during approval submission:", error);
        return ctx.internalServerError(
          "An error occurred during the submission process."
        );
      }
    },

    /**
     * Custom controller to get download links for approved images.
     */
    async downloadMyApprovedImages(ctx) {
      const { id: albumId } = ctx.params;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("You must be logged in.");
      }

      const album = await strapi.db.query("api::album.album").findOne({
        where: { id: albumId, user: { id: user.id } }, // CRITICAL: Ensures user owns this album
        populate: ["images"],
      });

      if (!album) {
        return ctx.notFound(
          "Album not found or you do not have permission to access it."
        );
      }

      // The rest of the logic is similar to your existing `getDownloadLinks`
      if (!album.allowDownloads || album.approvalStatus !== "Submitted") {
        return ctx.forbidden(
          "Downloads are not currently available for this gallery."
        );
      }

      const approvedImageIds = album.imageApprovals
        .filter((approval) => approval.approved)
        .map((approval) => approval.imageId);

      if (approvedImageIds.length === 0) {
        return ctx.badRequest("No images have been approved for download.");
      }

      const approvedImages = album.images.filter((img) =>
        approvedImageIds.includes(img.id)
      );
      const downloadLinks = approvedImages.map((img) => img.url);

      return this.transformResponse(downloadLinks);
    },
  })
);
