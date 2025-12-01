// src/api/testimonial/controllers/testimonial.ts
import { factories } from '@strapi/strapi';
import axios from 'axios';
import path from 'path';

interface KoaFile {
  filepath: string;
  originalFilename: string;
  mimetype: string;
  size: number;
}

const sanitizeFilename = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-.]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};

export default factories.createCoreController('api::testimonial.testimonial', ({ strapi }) => ({
  async create(ctx) {
    const isMultipart = ctx.is('multipart');
    strapi.log.info(`--- Intercepting POST /api/testimonials. Request type: ${isMultipart ? 'Multipart' : 'JSON'}`);

    if (!isMultipart) {
      strapi.log.info('Request is not multipart. Bypassing to default Strapi core controller.');
      return super.create(ctx);
    }

    strapi.log.info('--- Custom Testimonial Controller: Handling multipart form data ---');

    const getFolder = async (name: string) => {
      const folders = await strapi.entityService.findMany('plugin::upload.folder', { filters: { name } });
      if (folders.length > 0) {
        strapi.log.info(`Found existing folder "${name}" with ID: ${folders[0].id}`);
        return folders[0];
      }
      strapi.log.info(`Folder "${name}" not found. Creating it...`);
      return await strapi.service('plugin::upload.folder').create({ name });
    };

    try {
      const { body, files } = ctx.request;

      if (!body.data) return ctx.badRequest('Missing "data" field in request body.');
      
      const data = JSON.parse(body.data);
      const { albumId, ...testimonialPayload } = data; // Destructure albumId from the rest of the data
      const recaptchaToken = body.recaptcha;

      if (!recaptchaToken) return ctx.badRequest('reCAPTCHA token is missing.');

      strapi.log.info('Verifying reCAPTCHA token...');
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;
      const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, `secret=${secretKey}&response=${recaptchaToken}`);
      
      if (!response.data.success || response.data.score < 0.5) {
        strapi.log.warn(`reCAPTCHA verification failed:`, response.data);
        return ctx.forbidden('reCAPTCHA verification failed.');
      }
      strapi.log.info(`reCAPTCHA verification successful.`);
      
      let avatarId = null;

      if (files && files.avatar) {
        strapi.log.info('Avatar file found. Attempting upload...');
        const file = files.avatar as KoaFile;
        const testimonialsFolder = await getFolder('Testimonials');
        
        const timestamp = Date.now();
        const sanitizedName = sanitizeFilename(data.name);
        const sanitizedEvent = sanitizeFilename(data.event);
        const extension = path.extname(file.originalFilename);

        const filenameParts = [timestamp, sanitizedName];
        if (sanitizedEvent) filenameParts.push(sanitizedEvent);
        
        const uniqueFilename = `${filenameParts.join('-')}${extension}`;
        
        file.originalFilename = uniqueFilename;

        const uploadedFiles = await strapi.plugin('upload').service('upload').upload({
          data: { fileInfo: { folder: testimonialsFolder.id } },
          files: file,
        });
        
        if (uploadedFiles && uploadedFiles.length > 0) {
          avatarId = uploadedFiles[0].id;
          strapi.log.info(`✅ Successfully uploaded avatar with new name: ${uniqueFilename}. File ID: ${avatarId}`);
        }
      } else {
        strapi.log.warn('No avatar file was found in the multipart request.');
      }

      const finalData = { 
        ...testimonialPayload, 
        publishedAt: null, 
        avatar: avatarId,
        album: albumId ? Number(albumId) : null, // Link to album if albumId exists
      };
      
      const result = await strapi.db.query('api::testimonial.testimonial').create({ data: finalData });
      
      if (!result) {
        strapi.log.error('Database query returned no result. Creation failed silently.');
        return ctx.internalServerError('Failed to create testimonial entry.');
      }

      strapi.log.info('✅ Testimonial created as a draft. Result ID:', result.id);
      
      const sanitizedResult = await this.sanitizeOutput(result, ctx);
      return this.transformResponse(sanitizedResult);
    } catch (error) {
      strapi.log.error('Error in custom multipart testimonial controller:', error.details || error);
      return ctx.internalServerError('An error occurred during submission.', { error: error.details || error });
    }
  }
}));