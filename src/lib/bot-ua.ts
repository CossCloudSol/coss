/**
 * Crawlers, link previewers, headless browsers and HTTP libraries. Click-logging endpoints
 * ignore them (answer 204, write nothing) so admin counts are people. Not a security check:
 * a user agent is trivially faked; the closed enums and length caps on each endpoint are.
 */
const BOT_UA_RE =
  /bot\b|bot\/|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp\/|telegrambot|embedly|preview|headless|phantomjs|puppeteer|playwright|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl\/|wget\/|python-requests|python-urllib|aiohttp|httpx|go-http-client|java\/|okhttp|axios\/|node-fetch|undici|libwww|scrapy/i;

/** True for a missing user agent or one that names a bot or a script. */
export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua || ua.trim() === '') return true;
  return BOT_UA_RE.test(ua);
}
