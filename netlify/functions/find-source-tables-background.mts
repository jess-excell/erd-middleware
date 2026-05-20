import findSourceTableData from "../../functions/findSourceTables.ts";

export default async (req: Request) => {
    const { token, webhookURL, destinationTable, potentialSourceTables } = await req.json();

    if (!token || !destinationTable || !potentialSourceTables || !webhookURL) {
        console.error("Missing required fields");
        return;
    }

    console.log("Finding source table data...");

    const response = await findSourceTableData({ 
        token, destinationTable, potentialSourceTables 
    });

    console.log("Sending data back to Airtable...");

    const airtableResponse = await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response)
    });

    if (!airtableResponse.ok) {
        console.error(`Airtable request failed with response code ${airtableResponse.status}`);
        console.error(`Error message: ${airtableResponse.statusText}`);
    }
};