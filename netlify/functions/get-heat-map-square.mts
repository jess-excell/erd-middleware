export default async (req: Request) => {
    const colourBlock = (entries: number) => {
        if (!entries) return "#ebedf0";
        if (entries < 2) return "#9be9a8";
        if (entries < 3) return "#40c463";
        if (entries < 5) return "#30a14e";
        return "#216e39";
    }

    const data = req.url.split("?dates=")[1].split("&")[0];
    const dates = data.split(",");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);

    // Move start date 2 months back
    startDate.setMonth(startDate.getMonth()-2);

    // Move to Monday of that week
    const day = startDate.getDay();
    const isSunday = day === 0;

    // Set to sunday then add 1 (unless already sunday)
    const subtract = startDate.getDate() - day + (isSunday ? - 6 : 1)
    startDate.setDate(subtract);

    const counter = new Date(startDate);
    counter.setHours(0, 0, 0, 0);


    // Set up SVG formatting
    let boxes = "";
    const horizontalPadding = 30;
    const cell = 45;
    const gap = 9;

    // Get number of weeks to display
    const totalDays = Math.floor(
        (today.getTime() - counter.getTime()) / (1000 * 3600 * 24)
    );
    const totalWeeks = Math.ceil((totalDays + 1) / 7); // Add 1 incase it's monday -> monday for example

    const gridWidth = totalWeeks * (cell + gap) - gap;
    const gridHeight = 7 * (cell + gap) - gap;

    const widthAndHeight = gridWidth + 2 * horizontalPadding;
    const verticalPadding = (widthAndHeight - gridHeight) / 2;
    
    let weekNumber = 0;

    while (counter <= today) {
        const entries = dates.filter(date => counter.toISOString() === date).length;
        const day = counter.getDay();
 
        const dayIndex = day === 0 ? 6 : day - 1; // Monday = 0, Sunday = 6

        const xIndex = weekNumber * (cell + gap) + horizontalPadding;
        const yIndex = dayIndex * (cell + gap) + verticalPadding;

        const colour = colourBlock(entries);
        boxes += `
            <rect x="${xIndex}" y="${yIndex}" width="${cell}" height="${cell}" rx="2" fill="${colour}"/>
        `;

        if (day === 0) {
            weekNumber++;
        }
        counter.setDate(counter.getDate() + 1);
    }

    const finalDay = counter.getDay();
    if (finalDay === 0) weekNumber--;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${widthAndHeight}" height="${widthAndHeight}">
            <rect
                x="0"
                y="0"
                width="${widthAndHeight}"
                height="${widthAndHeight}"
                rx="8"
                fill="white"
            />
            ${boxes}
        </svg>
    `;

    return new Response(svg, { headers: { "Content-Type": "image/svg+xml" }});
}