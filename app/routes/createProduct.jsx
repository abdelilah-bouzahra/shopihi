import { json } from "@remix-run/node";
import { createShopifyProduct } from '../shopify.server';

export let action = async ({ request }) => {
  if (request.method !== 'POST') {
    return json(null, { status: 405 });
  }

  const requestBody = await request.json();
  const { shop, accessToken, productData } = requestBody;

  try {
    const response = await createShopifyProduct(shop, accessToken, productData);
    return json(response);
  } catch (error) {
    console.error('Error adding product:', error);
    return json({ message: 'Failed to add product' }, { status: 500 });
  }
};
