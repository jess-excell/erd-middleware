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
    console.log("Retrieving source table data (this may take several minutes)...");
    const responseData: ResponseType = [];
    let baseRecordResponse;
    try {
        baseRecordResponse = await fetch(
            `https://api.airtable.com/v0/${destinationTable.baseId}/${destinationTable.tableId}?maxRecords=1`, 
            { headers: { "Authorization": `Bearer ${token}`} }
        );
    } catch (e) {
        console.error(e)
        throw e;
    }
    console.log("Retrieved response");

    if (!baseRecordResponse.ok) {
        console.error("Could not get a base record to compare against.");
        console.error(`Error code: ${baseRecordResponse.status} | Message: ${baseRecordResponse.statusText}`);
        throw new Error("Missing base record");
    }

    console.log("Received base record response.");

    const baseRecordArray = (await baseRecordResponse.json()).records;

    if (!baseRecordArray || baseRecordArray.length < 1) {
        console.error("Could not retrieve any records from the table. Received a blank array / undefined.");
        throw new Error("Missing base record");
    }

    console.log("Base record stored");

    const baseRecord = baseRecordArray[0];
    
    // For each potential source table, see if its records contain the baseRecord
    for (const potentialSource of potentialSourceTables) {
        console.log("Checking table with ID " + potentialSource.tableId);
        
        let foundRecord = false;
        let offset;
        let go = true;
        
        // Search all the data in the base for a record with a matching name
        do {
            console.log("Retrieving data for table...");
            let requestUrl = `https://api.airtable.com/v0/${potentialSource.baseId}/${potentialSource.tableId}`;
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
            if (data.records.find((record: any) => record.fields.name === baseRecord.fields.name)) {
                console.log("Found a match");
                foundRecord = true;
                go = false;
                break;
            }
            console.log("Didn't find a match.");

            if (Object.keys(data).includes("offset")) {
                offset = data.offset;
            }
            else {
                offset = undefined;
            }
        } while (offset && go);
        console.log("Finished searching records.");

        responseData.push({
            ...potentialSource, foundMatchingRecord: foundRecord
        });
    } 
    console.log("Successfully generated response data.");
    return responseData;
}

export default findSourceTableData;