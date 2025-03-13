export function createCookieMap(cookie: string): Map<string, string> {
    const map = new Map<string, string>();
    const cookiePairs = cookie.split(';');
    for (const cookiePair of cookiePairs) {
        const trimmedPair = cookiePair.trim();
        const [key, value] = trimmedPair.split('=');
        map.set(key, value);
    }
    return map;
}