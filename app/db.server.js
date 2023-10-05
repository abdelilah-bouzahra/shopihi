import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { createShopifyProduct } from "./shopify.server";
import { json } from "@remix-run/node";

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
}

export async function saveApiCredentials(shop, apiUrl, apiId, apiKey) {
  try {
    const existingCredentials = await prisma.aPICredentials.findUnique({ where: { shop } });

    if (existingCredentials) {
      return await prisma.aPICredentials.update({
        where: { shop },
        data: { apiUrl, apiId, apiKey },
      });
    } else {
      return await prisma.aPICredentials.create({
        data: { shop, apiUrl, apiId, apiKey },
      });
    }
  } catch (error) {
    console.error('Error saving API credentials:', error);
  }
}


export const getToken = async (apiUrl, apiId, apiKey) => {
  try {
    // Create the request body
    const requestBody = {
      'id': apiId,
      'key': apiKey,
    };

    console.log(requestBody);

    // Send a POST request to the external API
    const response = await axios.post(`${apiUrl}/api/developer/getToken`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const { token } = response.data;
      return token; // Return the token
    } else {
      throw new Error('API request failed');
    }
  } catch (error) {
    throw error; // Propagate the error
  }
};

export const getArticles = async (apiUrl, token) => {
  try {
    const response = await axios.get(`${apiUrl}/api/articles?_limit=10000&targetMarketPlace=4`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    });

    if (response.status === 200) {
      const articles = response.data;
      if (articles.length > 0) {
        return articles;
      } else {
        console.log('No articles found.');
        return [];
      }
    } else {
      throw new Error('API request failed');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const getPrice = async (apiUrl, token, idArticle) => {
  try {
    const endpoint = `${apiUrl}/api/articles/${idArticle}/tariffs`;
    const response = await axios.get(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    });

    if (response.status === 200) {
      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        return data[0].price;
      }
    }
  } catch (error) {
    console.error('Error fetching price:', error);
  }

  return 0;
};

export const sync = async (shop, accessToken, apiUrl, apiId, apiKey) => {
  try {
    const token = await getToken(apiUrl, apiId, apiKey);
    if (!token) {
      throw new Error("Failed to fetch token");
    }

    const articles = await getArticles(apiUrl, token);
    if (!articles || articles.length === 0) {
      throw new Error("No articles fetched or failed to fetch articles");
    }

    for (let article of articles) {
      getPrice(apiUrl, token, article.id).then(async (price) => {
        try {
          let productData = {
            title: article.name,
            body_html: '',
            images: article.image ? [{ src: `${apiUrl}/article.image` }] : [],
            variants: [
              {
                price: price.toString(),
              },
            ],
          };
          
          const response = await createShopifyProduct(shop, accessToken, productData);
          return json(response);
        } catch (error) {
          console.error('Error adding product');
          let productData = {
            title: article.name,
            body_html: '',
            images: article.image ? [{ src: `${apiUrl}/article.image` }] : [],
            variants: [
              {
                price: price.toString(),
              },
            ],
          };
          console.log(productData);
          return json({ message: 'Failed to add product' }, { status: 500 });
        }
      });
    }
  } catch (error) {
    console.error("Sync failed:", error);
  }
};

export default prisma;

