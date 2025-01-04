// server/api/playlist.ts
export default defineEventHandler(async (event) => {
    const config = {
        headers: {
            'Cache-Control': 'max-age=0',
            'Data-Agent': 'The Stream',
            'Content-Type': 'application/json',
            'User-Agent': 'okhttp/4.9.0',
            'Accept': 'application/json'
        }
    };

    const apiKey = process.env.NUXT_API_KEY;
    if (!apiKey) {
        throw new Error('API key not found in environment variables');
    }

    const response = await $fetch(
        `https://ss.paneli.live/api/api.php?get_search_results=null&count=1000000&api_key=${apiKey}`,
        { headers: config.headers }
    );

    // Generate M3U content
    let m3uContent = '#EXTM3U\n';

    for (const channel of response.posts) {
        m3uContent += `#EXTINF:-1 tvg-id="${channel.channel_id}" tvg-name="${channel.channel_name}" tvg-logo="${channel.channel_image}" group-title="${channel.category_name}",${channel.channel_name}\n`;
        m3uContent += `#EXTVLCOPT:http-user-agent=shikoshqipPlayer\n`;
        m3uContent += `${channel.channel_url}\n\n`;
    }

    // Set response headers for file download
    setHeader(event, 'Content-Type', 'application/x-mpegurl');
    setHeader(event, 'Content-Disposition', 'attachment; filename="playlist.m3u"');

    return m3uContent;
});