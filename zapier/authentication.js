/**
 * ClientFlow Zapier Authentication
 *
 * Uses API Key authentication
 * Users generate API keys in Settings → API Keys
 */

const testAuth = async (z, bundle) => {
  // Test the API key by fetching tenant info
  const response = await z.request({
    url: `${bundle.authData.baseUrl}/api/tenant`,
    method: 'GET',
  });

  if (response.status !== 200) {
    throw new Error('Invalid API key or base URL');
  }

  const tenant = response.json;

  return {
    id: tenant.id,
    name: tenant.businessName || tenant.name,
  };
};

module.exports = {
  type: 'custom',

  fields: [
    {
      key: 'baseUrl',
      label: 'ClientFlow URL',
      type: 'string',
      required: true,
      default: 'https://app.clientflow.com',
      helpText: 'Your ClientFlow base URL (usually https://app.clientflow.com)',
    },
    {
      key: 'apiKey',
      label: 'API Key',
      type: 'string',
      required: true,
      helpText: 'Generate an API key in Settings → API Keys in your ClientFlow dashboard',
    },
  ],

  test: testAuth,

  // Connection label shown in Zapier UI
  connectionLabel: '{{name}}',
};
