import { useState, useCallback } from "react";
import { json } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  Badge,
  VerticalStack,
  Box,
  HorizontalStack,
  TextField,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";
import axios from 'axios';

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const initialSettings = {
    api: "",
    id: "",
    key: "",
    autoSync: false,
  };

  return json({ shop: session.shop.replace(".myshopify.com", ""), initialSettings, session });
};

export default function Index() {
  const nav = useNavigation();
  const { initialSettings, session } = useLoaderData();

  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";

  const [formData, setFormData] = useState(initialSettings);

  const handleChange = (field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleToggle = useCallback(() => {
    setFormData((prevData) => ({
      ...prevData,
      autoSync: !prevData.autoSync,
    }));
  }, []);

  const getToken = async (api, id, key) => {
    try {
      // Create the request body
      const requestBody = {
        id,
        key,
      };

      // Send a POST request to the external API
      const response = await axios.post(`${api}/developer/getToken`, requestBody, {
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

  const getArticles = async (api, token) => {
    try {
      // Send a GET request to the external API
      const response = await axios.get(`${api}/articles`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      });

      if (response.status === 200) {
        const articles = response.data;
        if (articles.length > 0) {
          return articles; // Return the articles
        } else {
          console.log('No articles found.');
          return []; // Return an empty array if no articles are found
        }
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      // Handle errors here
      console.error('Error:', error);
      throw error; // Propagate the error
    }
  };

  const save = async ({ request }) => {

  };

  const sync = async () => {
    try {
      const { api, id, key } = formData;

      // 1. Fetch articles from your external API
      const token = await getToken(api, id, key);
      if (!token) {
        throw new Error("Failed to fetch token");
      }

      const articles = await getArticles(api, token);
      if (!articles || articles.length === 0) {
        throw new Error("No articles fetched or failed to fetch articles");
      }

      console.log(articles);

      // 2. Loop through the articles and create products on Shopify
      for (let article of articles) {
        const productData = {
          product: {
            title: article.name,
            body_html: '', // Description, if available
            images: article.image ? [{ src: article.image }] : [], // If the image is available
            variants: [], // Any product variants you might want to add
          },
        };

        const response = await fetch('/createProduct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shop: session.shop,
            accessToken: session.accessToken,
            productData: {
              title: article.name,
              body_html: '', // Description, if available.
              images: article.image ? [{ src: article.image }] : [], // If the image is available.
            },
          }),
        });

        const shopifyResponse = await response.json();
        if (shopifyResponse.errors) {
          throw new Error(shopifyResponse.errors);
        }
      }
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  // async function sync() {
  //   try {
  //     const { api, id, key } = formData;

  //     let token;
  //     try {
  //       token = await getToken(api, id, key);
  //     } catch (error) {
  //       throw new Error(`Failed to get token`);
  //     }

  //     let articles;
  //     try {
  //       articles = await getArticles(api, token);
  //     } catch (error) {
  //       throw new Error(`Failed to fetch articles`);
  //     }

  //     for (let article of articles) {
  //       const productData = {
  //         title: article.name,
  //         body_html: '',
  //         images: article.image ? [{ src: article.image }] : [],
  //         variants: [],
  //       };

  //       const response = await fetch('/shopify/createProduct', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           shop: session.shop,
  //           accessToken: session.accessToken,
  //           productData: productData,
  //         }),
  //       });

  //       if (!response.ok) {
  //         throw new Error(`Failed to create product: ${response.statusText}`);
  //       }

  //       const shopifyResponse = await response.json();
  //       if (shopifyResponse.errors) {
  //         throw new Error(shopifyResponse.errors);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Sync failed:", error);
  //   }
  // }    

  const headerMarkup = (
    <Box width="100%">
      <HorizontalStack gap="2" align="center" blockAlign="center">
        <label htmlFor="autoSync">
          <Text variant="headingMd" as="h6">
            Synchronisation automatique
          </Text>
        </label>
        <Badge status={formData.autoSync ? "success" : undefined}>
          {formData.autoSync ? "Activé" : "Désactivé"}
        </Badge>
        <div style={{ flex: '1' }}> {/* Use a div with inline style for flex */}
          <Button
            role="switch"
            id="autoSync"
            ariaChecked={formData.autoSync ? "true" : "false"}
            onClick={handleToggle}
          >
            {formData.autoSync ? "Désactiver" : "Activer"}
          </Button>
        </div>
        <Button
          primary
          onClick={sync}
          loading={isLoading}
        >
          Synchroniser
        </Button>
        <Button
          primary
          onClick={save}
          loading={isLoading}
        >
          Sauvegarder
        </Button>
      </HorizontalStack>
    </Box>
  );

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <Box width="100%">
              <VerticalStack gap="2">
                <TextField
                  label="API"
                  value={formData.api}
                  onChange={(value) => handleChange("api", value)}
                  autoComplete="off"
                />
                <TextField
                  label="ID"
                  value={formData.id}
                  onChange={(value) => handleChange("id", value)}
                  autoComplete="off"
                />
                <TextField
                  label="KEY"
                  value={formData.key}
                  onChange={(value) => handleChange("key", value)}
                  autoComplete="off"
                />
                {headerMarkup}
              </VerticalStack>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
