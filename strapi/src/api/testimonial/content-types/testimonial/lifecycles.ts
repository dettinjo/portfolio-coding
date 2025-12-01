// src/api/testimonial/content-types/testimonial/lifecycles.ts

export default {
  async afterCreate(event) {
    const { result } = event;

    // Check if the entry was created as a draft (publishedAt is null)
    if (result && result.publishedAt === null) {
      strapi.log.info(`New testimonial draft created (ID: ${result.id}). Sending notification...`);

      const adminUrl = process.env.STRAPI_ADMIN_URL || 'http://localhost:1337';
      const notificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

      if (!notificationEmail) {
        strapi.log.warn('ADMIN_NOTIFICATION_EMAIL environment variable is not set. Cannot send notification.');
        return;
      }

      try {
        await strapi.plugin('email').service('email').send({
          to: notificationEmail,
          subject: `New Testimonial for Moderation: ${result.name}`,
          html: `
            <h1>New Testimonial Awaiting Approval</h1>
            <p>A new testimonial has been submitted by <strong>${result.name}</strong>.</p>
            <p><strong>Review:</strong> <em>"${result.quote}"</em></p>
            <p>Please review and publish it from the Strapi admin panel.</p>
            <a href="${adminUrl}/admin/content-manager/collection-types/api::testimonial.testimonial/${result.id}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #4945FF; text-decoration: none; border-radius: 5px;">
              Moderate Now
            </a>
          `,
        });
        strapi.log.info(`✅ Notification email sent successfully to ${notificationEmail}`);
      } catch (err) {
        strapi.log.error('Failed to send notification email:', err);
      }
    }
  },
};