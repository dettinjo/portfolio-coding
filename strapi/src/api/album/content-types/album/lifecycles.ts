// src/api/album/content-types/album/lifecycles.ts

// --- Helper function to generate a random alphanumeric string ---
const generateRandomToken = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generates a unique token and ensures it doesn't already exist in the database.
 * @returns {Promise<string>} A unique token.
 */
const generateUniqueApprovalToken = async (): Promise<string> => {
  let token: string;
  let isUnique = false;
  
  while (!isUnique) {
    // --- THIS IS THE DEFINITIVE CHANGE ---
    token = generateRandomToken(5); // Generate a 5-character token
    // ------------------------------------
    
    const existingAlbum = await strapi.db.query('api::album.album').findOne({
      where: { approvalToken: token },
      select: ['id'],
    });

    if (!existingAlbum) {
      isUnique = true;
    } else {
      strapi.log.warn(`Token collision detected: ${token}. Generating a new one.`);
    }
  }
  
  return token;
};

export default {
  /**
   * This hook runs before creating or updating an album.
   */
  async beforeUpdate(event) {
    const { data, where } = event.params;

    if (data.approvalRequired === true) {
      const existingAlbum = await strapi.entityService.findOne('api::album.album', where.id);

      if (existingAlbum && !existingAlbum.approvalToken) {
        data.approvalToken = await generateUniqueApprovalToken();
        strapi.log.info(`Generated new 5-character unique approval token for Album ID: ${where.id}`);
      }
    }
  },
};