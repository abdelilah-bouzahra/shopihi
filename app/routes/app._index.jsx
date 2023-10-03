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
import prisma, { sync } from "~/db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const shop = session.shop;

  let initialSettings = {
    apiUrl: "",
    apiId: "",
    apiKey: "",
  };

  try {
    const credentials = await prisma.aPICredentials.findUnique({ where: { shop } });
    if (credentials) {
      initialSettings = {
        apiUrl: credentials.apiUrl,
        apiId: credentials.apiId,
        apiKey: credentials.apiKey,
      };
    }
  } catch (error) {
    console.error('Loader error:', error);
  }

  return json({ shop, initialSettings, session });
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

  const handleSync = async () => {
    const { apiUrl, apiId, apiKey } = formData;
    const shop = session.shop;
    const accessToken = session.accessToken;

    try {
      const response = await fetch('/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, accessToken, apiUrl, apiId, apiKey })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}, ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error during fetch operation');
    }
  };

  const handleSave = async () => {
    const { apiUrl, apiId, apiKey } = formData;
    const shop = session.shop;
  
    try {
      const response = await fetch('/saveApiCredentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, apiUrl, apiId, apiKey })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}, ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error during fetch operation');
    }
  };

  const headerMarkup = (
    <Box width="100%">
      <HorizontalStack gap="2" align="center" blockAlign="center">
        {/* <label htmlFor="autoSync">
          <Text variant="headingMd" as="h6">
            Synchronisation automatique
          </Text>
        </label>
        <Badge status={formData.autoSync ? "success" : undefined}>
          {formData.autoSync ? "Activé" : "Désactivé"}
        </Badge>
        <div style={{ flex: '1' }}>
          <Button
            role="switch"
            id="autoSync"
            ariaChecked={formData.autoSync ? "true" : "false"}
            onClick={handleToggle}
          >
            {formData.autoSync ? "Désactiver" : "Activer"}
          </Button>
        </div> */}
        <Button
          primary
          onClick={handleSync}
          loading={isLoading}
        >
          Synchroniser
        </Button>
        <Button
          primary
          onClick={handleSave}
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
                  value={formData.apiUrl}
                  onChange={(value) => handleChange("apiUrl", value)}
                  autoComplete="off"
                />
                <TextField
                  label="ID"
                  value={formData.apiId}
                  onChange={(value) => handleChange("apiId", value)}
                  autoComplete="off"
                />
                <TextField
                  label="KEY"
                  value={formData.apiKey}
                  onChange={(value) => handleChange("apiKey", value)}
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
