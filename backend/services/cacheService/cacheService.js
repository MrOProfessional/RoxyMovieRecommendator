import NodeCache from "node-cache";

const cache = new NodeCache();

const cacheValue = (key, value) => {
    cache.set(key, value);
}

const getValueFromCache = (key) => {
    return cache.get(key);
}

const cleanCache = () => {
    return cache.flushAll();
}
export { cacheValue, getValueFromCache, cleanCache };
