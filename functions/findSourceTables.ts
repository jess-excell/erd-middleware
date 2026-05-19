type params = {
    token: string
    destinationTable: baseAndTable, 
    potentialSourceTables: baseAndTable[]
}

type baseAndTable = {
    baseId: string;
    tableId: string;
}

type ResponseType = {
    baseId: string;
    tableId: string;
    foundMatchingRecord: boolean
}[];

async function findSourceTableData({token, destinationTable, potentialSourceTables}: params): Promise<ResponseType> {
    const responseData: ResponseType = [];
    const baseRecordResponse = await fetch(
        `https://api.airtable.com/v0/${destinationTable.baseId}/${destinationTable.tableId}?maxRecords=1`, 
        { headers: { "Authorization": `Bearer ${token}`} }
    );

    if (!baseRecordResponse.ok) {
        console.error("Could not get a base record to compare against.");
        console.error(`Error code: ${baseRecordResponse.status} | Message: ${baseRecordResponse.statusText}`);
        throw new Error("Missing base record");
    }

    const baseRecordArray = (await baseRecordResponse.json()).records;

    if (!baseRecordArray || baseRecordArray.length < 1) {
        console.error("Could not retrieve any records from the table. Received a blank array / undefined.");
        throw new Error("Missing base record");
    }

    const baseRecord = baseRecordArray[0];
    let foundRecord = false;
    
    // For each potential source table, see if its records contain the baseRecord
    for (const potentialSource of potentialSourceTables) {
        let offset: number | undefined;
        let go = true;
        
        // Search all the data in the base for a record with a matching name
        do {
            let requestUrl = `https://api.airtable.com/v0/${destinationTable.baseId}/${destinationTable.tableId}`;
            if (offset) {
                requestUrl += `?offset=${offset}`;
            }
            const res = await fetch(requestUrl, { headers: { "Authorization": `Bearer ${token}` }});
    
            if (!res.ok) {
                console.error("Request was unsuccessful.");
                console.error(`Error code: ${res.status} | Message: ${res.statusText}`);
                throw new Error("Couldn't fetch records for the table");
            }

            const data = await res.json();

            // Match records based on name for now
            if (data.records.find((record: any) => record.fields.name === baseRecord.name)) {
                foundRecord = true;
                go = false;
                break;
            }

            if (Object.keys(data).includes("offset")) {
                offset = data.offset;
            }
            else {
                offset = undefined;
            }
        } while (offset && go);

        responseData.push({
            ...potentialSource, foundMatchingRecord: foundRecord
        });
    } 
    console.log("Successfully generated response data.");
    return responseData;
}

export default findSourceTableData;