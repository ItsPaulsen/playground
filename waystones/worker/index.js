const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const FILTER_MAP = {
  iir:        'map_iir',
  rarity:     'map_rare_monsters',
  dropchance: 'map_bonus',
  packsize:   'map_packsize',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);

    const filters = {};
    for (const [param, filterId] of Object.entries(FILTER_MAP)) {
      const val = url.searchParams.get(param);
      if (val !== null) filters[filterId] = { min: parseInt(val, 10) };
    }

    if (Object.keys(filters).length === 0) {
      return json({ error: 'No filters provided' }, 400);
    }

    // Fetch current softcore league, fall back to hardcoded
    let league = 'Runes of Aldur';
    try {
      const res = await fetch('https://www.pathofexile.com/api/trade2/data/leagues', {
        headers: { 'User-Agent': 'poe2-waystone-tool/1.0' },
      });
      if (res.ok) {
        const data = await res.json();
        const found = data.result?.find(l => !l.id.startsWith('HC') && l.realm === 'poe2');
        if (found) league = found.id;
      }
    } catch {
      // use fallback
    }

    // POST search query
    const body = JSON.stringify({
      query: {
        status: { option: 'securable' },
        filters: {
          map_filters: { filters },
          type_filters: { filters: { category: { option: 'map.waystone' } } },
        },
      },
      sort: { price: 'asc' },
    });

    let searchData;
    try {
      const res = await fetch(
        `https://www.pathofexile.com/api/trade2/search/poe2/${encodeURIComponent(league)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'poe2-waystone-tool/1.0' },
          body,
        }
      );
      if (!res.ok) {
        const text = await res.text();
        return json({ error: 'Trade API error', status: res.status, detail: text }, 502);
      }
      searchData = await res.json();
    } catch {
      return json({ error: 'Failed to reach trade API' }, 502);
    }

    const tradeUrl = `https://www.pathofexile.com/trade2/search/poe2/${encodeURIComponent(league)}/${searchData.id}`;
    return json({ url: tradeUrl, id: searchData.id, league });
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
