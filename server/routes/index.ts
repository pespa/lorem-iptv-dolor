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

    // Group channels by category
    const channelGroups: { [key: string]: any[] } = {};
    
    for (const channel of response.posts) {
        // Clean group title by removing "➤ " and "24/7"
        let groupTitle = channel.category_name
            .replace('➤ ', '')
            .replace('24/7', '')
            .trim();

        // Rename specific groups
        if (groupTitle === 'Muzik') {
            groupTitle = 'Muzike';
        } else if (groupTitle === 'Gëzuar 2025') {
            groupTitle = 'Muzike';
        } else if (groupTitle === 'Fëmije') {
            groupTitle = 'Femije';
        } else if (groupTitle === 'Humor') {
            groupTitle = 'Filma';
        } else if (groupTitle === 'Humor & Argetim') {
            groupTitle = 'Filma';
        } else if (groupTitle === 'Seriale') {
            groupTitle = 'Filma';
        }

        // Skip channels from specific categories
        const excludedCategories = [
            'greke',
            'franceze',
            'spanjolle',
            'skandinave',
            'bosnia',
            'zvicer',
            'austri',
            'maqedonia',
            'turke',
            'exyu',
            'cinema de',
            'fetare',
            'mahmutovitët dhe rexhepovitët'
        ];

        // Standardize sport groups based on group title or channel name
        const channelNameLower = channel.channel_name.toLowerCase();
        if (
            groupTitle.toLowerCase().includes('sport') ||
            channelNameLower.includes('sport') ||
            channelNameLower.includes('football') ||
            channelNameLower.includes('soccer')
        ) {
            groupTitle = 'Sport';
        }
        // Group channels based on specific providers
        else if (channelNameLower.startsWith('tring')) {
            groupTitle = 'Tring';
        }
        else if (channelNameLower.startsWith('meti')) {
            groupTitle = 'Meti';
        }
        else if (channelNameLower.startsWith('dark')) {
            groupTitle = 'Dark';
        }
        else if (channelNameLower.startsWith('tibo')) {
            groupTitle = 'Tibo';
        }
        else if (channelNameLower.startsWith('tëvë')) {
            groupTitle = 'Tëvë';
        }
        
        const categoryLower = groupTitle.toLowerCase();
        if (excludedCategories.some(cat => categoryLower.includes(cat))) {
            continue;
        }

        // Skip YouTube channels and some groups
        if (channel.channel_url.toLowerCase().includes('youtube')) continue;
        
        if (!channelGroups[groupTitle]) {
            channelGroups[groupTitle] = [];
        }
        channelGroups[groupTitle].push(channel);
    }

    // Priority channels order
    const priorityChannels = [
        "Top channel ⁴ᴷ",
        "Klan ⁴ᴷ",
        "Vision plus ⁴ᴷ"
    ];

    // Sort channels within each group
    for (const group in channelGroups) {
        channelGroups[group].sort((a, b) => {
            // Check if channels are in priority list
            const aIndex = priorityChannels.indexOf(a.channel_name);
            const bIndex = priorityChannels.indexOf(b.channel_name);
            
            // If both channels are in priority list, sort by priority order
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
            }
            
            // If only one channel is in priority list, it should come first
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            
            // Otherwise sort alphabetically
            return a.channel_name.localeCompare(b.channel_name);
        });
    }

    // Generate M3U content
    let m3uContent = '#EXTM3U\n';

    // Output sorted channels by group
    for (const groupTitle in channelGroups) {
        for (const channel of channelGroups[groupTitle]) {
            const cleanChannelName = channel.channel_name.trim();
            m3uContent += `#EXTINF:-1 tvg-id="${channel.channel_id}" tvg-name="${cleanChannelName}" tvg-logo="${channel.channel_image}" group-title="${groupTitle}",${cleanChannelName}\n`;
            m3uContent += `#EXTVLCOPT:http-user-agent=shikoshqipPlayer\n`;
            m3uContent += `${channel.channel_url}\n\n`;
        }
    }

    // Set response headers for file download
    setHeader(event, 'Content-Type', 'application/x-mpegurl');
    setHeader(event, 'Content-Disposition', 'attachment; filename="playlist.m3u"');

    return m3uContent;
});