import { json } from "@remix-run/node";
import { saveApiCredentials } from "~/db.server";

export let action = async ({ request }) => {

  const requestBody = await request.json();
  const { shop, apiUrl, apiId, apiKey } = requestBody;

  try {
    const response = await saveApiCredentials(shop, apiUrl, apiId, apiKey);
    return json(response);
  } catch (error) {
    console.error('Error saving api credentials:', error);
    return json({ message: 'Failed to save api credentials' }, { status: 500 });
  }
};
