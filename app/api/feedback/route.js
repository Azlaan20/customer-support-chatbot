export async function POST(req, res) {
    const { message, feedback } = await req.json();
    
    // Handle the feedback (e.g., save to database, log, etc.)
    console.log('Feedback received:', { message, feedback });

    return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
}
