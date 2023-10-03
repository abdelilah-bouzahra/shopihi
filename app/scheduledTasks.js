import { authenticate } from './shopify.server';
import prisma, { sync } from './db.server';

const cron = require('node-cron');

cron.schedule('*/10 * * * *', async () => {
  try {
    console.log('Hello from Schedule');

    const allCredentials = await prisma.aPICredentials.findMany();

    for (const credentials of allCredentials) {
      try {
        console.log('Syncing for shop:', credentials.shop);
        //await sync(credentials.apiUrl, credentials.apiId, credentials.apiKey);
      } catch (syncError) {
        console.error('Error during individual sync:', syncError);
      }
    }
  } catch (error) {
    console.error('Error during scheduled sync:', error);
  }
});

module.exports = cron;
