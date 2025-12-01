import type { CollectionConfig } from 'payload'

import { 
  setup2FAHandler, 
  enable2FAHandler, 
  verify2FAHandler, 
  disable2FAHandler, 
  regenerateBackupCodesHandler,
  loginInitHandler
} from '../endpoints/2fa'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    components: {
      views: {
        edit: {
          twoFactorAuth: {
            Component: '@/payload/components/TwoFactorAuth#TwoFactorAuth',
            tab: {
              label: 'Two-Factor Auth',
            },
          },
        },
      },
    },
  },
  auth: true,
  endpoints: [
    {
      path: '/2fa/login-init',
      method: 'post',
      handler: loginInitHandler,
    },
    {
      path: '/2fa/setup',
      method: 'post',
      handler: setup2FAHandler,
    },
    {
      path: '/2fa/enable',
      method: 'post',
      handler: enable2FAHandler,
    },
    {
      path: '/2fa/verify',
      method: 'post',
      handler: verify2FAHandler,
    },
    {
      path: '/2fa/disable',
      method: 'post',
      handler: disable2FAHandler,
    },
    {
      path: '/2fa/regenerate-backup-codes',
      method: 'post',
      handler: regenerateBackupCodesHandler,
    },
  ],
  fields: [
    // Email added by default
    {
      name: 'twoFactorEnabled',
      type: 'checkbox',
      label: 'Two-Factor Authentication Enabled',
      defaultValue: false,
      admin: {
        readOnly: true,
        description: '2FA status for this user',
      },
    },
    {
      name: 'twoFactorSecret',
      type: 'text',
      label: 'Two-Factor Secret',
      admin: {
        hidden: true,
      },
      // This will store the encrypted TOTP secret
    },
    {
      name: 'twoFactorBackupCodes',
      type: 'array',
      label: 'Backup Codes',
      admin: {
        hidden: true,
      },
      fields: [
        {
          name: 'code',
          type: 'text',
          required: true,
        },
        {
          name: 'used',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'twoFactorEnrolledAt',
      type: 'date',
      label: 'Two-Factor Enrolled At',
      admin: {
        readOnly: true,
        description: 'When the user enrolled in 2FA',
      },
    },
  ],
}
