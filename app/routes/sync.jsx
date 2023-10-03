import { json } from "@remix-run/node";
import { sync } from "~/db.server";

export let action = async ({ request }) => {

  const requestBody = await request.json();
  const { shop, accessToken, apiUrl, apiId, apiKey} = requestBody;

  try {
    const response = await sync(shop, accessToken, apiUrl, apiId, apiKey);
    return json(response);
  } catch (error) {
    console.error('Error sync :', error);
    return json({ message: 'Failed to sync' }, { status: 500 });
  }
};
