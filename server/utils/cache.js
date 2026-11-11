// A tiny in-memory cache for public GET pages (product list, banners).
// Many visitors reading the same page cost ONE database query per few seconds.
//
//   app.use("/api/products", cacheGets(30));   // keep answers for 30 seconds
//   app.use("/api", clearCacheOnChanges);      // any POST/PUT/DELETE empties the cache

const store = new Map(); // url -> { body, expires }
const MAX_ENTRIES = 200; // stops odd search URLs from filling up memory

function cacheGets(seconds) {
  return (req, res, next) => {
    if (req.method !== "GET") return next();

    const key = req.originalUrl;
    const hit = store.get(key);
    if (hit && hit.expires > Date.now()) {
      res.set("X-Cache", "HIT");
      return res.json(hit.body);
    }

    // Wrap res.json so a successful answer is saved before it is sent.
    const send = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) {
        if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value);
        store.set(key, { body, expires: Date.now() + seconds * 1000 });
      }
      return send(body);
    };
    next();
  };
}

// Stock, prices, banners... may have changed, so forget everything saved.
function clearCacheOnChanges(req, res, next) {
  if (req.method !== "GET" && req.method !== "OPTIONS") store.clear();
  next();
}

module.exports = { cacheGets, clearCacheOnChanges };
