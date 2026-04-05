const NodeCache = require('node-cache');

// Cache TTL: 5 minutes for user data, 1 hour for problemset
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

module.exports = cache;
