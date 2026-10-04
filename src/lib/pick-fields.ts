/**
 * Field allowlists for admin writes: a request body is never passed to Prisma
 * as-is. Only the listed fields are kept (anything else, including id,
 * createdAt and relations, is dropped) and each value must have the listed
 * type. Dependency-free (tested in scripts/test/pick-fields.test.mjs).
 */
export type FieldType = 'string' | 'string?' | 'boolean' | 'int' | 'string[]' | 'json';
export type FieldSpec = Readonly<Record<string, FieldType>>;

const ok: Record<FieldType, (v: unknown) => boolean> = {
  string: (v) => typeof v === 'string',
  'string?': (v) => v === null || typeof v === 'string',
  boolean: (v) => typeof v === 'boolean',
  int: (v) => typeof v === 'number' && Number.isInteger(v),
  'string[]': (v) => Array.isArray(v) && v.every((x) => typeof x === 'string'),
  json: (v) => v !== undefined,
};

/** The allowed fields present in body, or the first field with a wrong type. */
export function pickFields(body: unknown, spec: FieldSpec): { data: Record<string, unknown> } | { error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Body must be a JSON object' };
  const data: Record<string, unknown> = {};
  for (const [field, type] of Object.entries(spec)) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const v = (body as Record<string, unknown>)[field];
    if (v === undefined) continue;
    if (!ok[type](v)) return { error: `Invalid value for ${field}: expected ${type}` };
    data[field] = v;
  }
  return { data };
}

/** SiteSettings columns editable from the admin (settings and schema pages). */
export const SITE_SETTINGS_FIELDS: FieldSpec = {
  ogImageUrl: 'string?', logoUrl: 'string?', logoLightUrl: 'string?', faviconUrl: 'string?', appleTouchUrl: 'string?', courseOgDefault: 'string?',
  primaryPhone: 'string?', secondaryPhone: 'string?', email: 'string?', whatsappNumber: 'string?', websiteUrl: 'string?',
  facebookUrl: 'string?', instagramUrl: 'string?', linkedinUrl: 'string?', youtubeUrl: 'string?', twitterUrl: 'string?',
  orgName: 'string?', orgLegalName: 'string?', orgFoundedYear: 'string?', orgGstNumber: 'string?', googleMapsUrl: 'string?',
  schemaOrgOverride: 'string?', schemaWebSiteOverride: 'string?', schemaDilsOverride: 'string?', schemaAmeerpetOverride: 'string?',
  schemaOrgEnabled: 'boolean', schemaWebSiteEnabled: 'boolean', schemaDilsEnabled: 'boolean', schemaAmeerpetEnabled: 'boolean',
};

/** ContentBlock columns editable from the admin. */
export const CONTENT_BLOCK_FIELDS: FieldSpec = {
  blockType: 'string', page: 'string', title: 'string', body: 'string', icon: 'string',
  metadata: 'json', gridStyle: 'string', isVisible: 'boolean', sortOrder: 'int',
};

/** HomepageSettings columns editable from the admin. */
export const HOMEPAGE_FIELDS: FieldSpec = {
  heroHeadline: 'string', heroSubtext: 'string',
  heroCTAPrimaryText: 'string', heroCTAPrimaryUrl: 'string', heroCTASecondaryText: 'string', heroCTASecondaryUrl: 'string',
  stat1Value: 'string', stat1Label: 'string', stat2Value: 'string', stat2Label: 'string',
  stat3Value: 'string', stat3Label: 'string', stat4Value: 'string', stat4Label: 'string',
  announcementEnabled: 'boolean', announcementText: 'string', announcementUrl: 'string', announcementBgColor: 'string',
  featuredCourseIds: 'string[]', featuredSectionTitle: 'string', featuredSectionSubtext: 'string',
  showFeaturedCourses: 'boolean', showTestimonials: 'boolean', showHiringPartners: 'boolean', showStats: 'boolean',
};
