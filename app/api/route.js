export async function POST(request) {
    const data = await request.json();
    console.log("Received data:", data); // Log the received data

    // Process the photo data here
    // ...

    return new Response("Photo saved", { status: 200 });
}

const handleDoneClick = (event) => {
    event.preventDefault(); // Prevent the default form submission
    console.log("Done button clicked"); // Check if this logs when clicked
    savePhoto(); // Call the savePhoto function
};
