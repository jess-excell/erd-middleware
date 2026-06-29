import express, { Router } from "express";
import serverless from "serverless-http";

const api = express();
const router = Router()

api.use(express.json())

router.get("/hello-world/", (req, res) => res.send("Hello World!"));
router.post("/table-information/", async (req, res) => {
    try {
        const { token, baseID } = req.body;

        if (!token || !baseID) {
            return res.status(400).json({
                error: "Missing required fields",
            });
        }

        const tableResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${baseID}/tables`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!tableResponse.ok) {
            const errorText = await tableResponse.text();
            console.error(`Airtable request failed with response code: ${tableResponse.status}`)
            if (tableResponse.status === 408) {
                return res.status(tableResponse.status).json({
                    error: "Airtable request sent back 408",
                    details: errorText,
                });
            }
            return res.status(tableResponse.status).json({
                error: "Airtable request failed",
                details: errorText,
            });
        }

        const json = await tableResponse.json();
        const condensedBody = json.tables.map((table: any) => ({
            id: table.id,
            name: table.name,
            fields: table.fields.map((field: any) => ({
              name: field.name,
              id: field.id,
              type: field.type,
              isPrimary: table.primaryFieldId === field.id
            })),
            relatedFields: table.fields
                .filter((field: any) => !!field.options && !! field.options.linkedTableId) // Where there is a linkedTableId
                .map((field: any) => `${field.options.linkedTableId} | ${baseID}`)
        }));

        return res.status(200).json(condensedBody);
    } 
    catch (error) {
        return res.status(500).json({
            error: "Internal server error",
        });
    }
});

api.use("/api/", router);

export const handler = serverless(api)
