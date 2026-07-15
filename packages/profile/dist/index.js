// src/types.ts
var PROFILE_SCHEMA_VERSION = 1;

// src/validate.ts
var ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var COUNTRY_CODE = /^[A-Z]{2}$/;
function issue(issues, code, path, message) {
  issues.push({ code, path, message });
}
function requiredString(issues, value, path) {
  if (typeof value !== "string" || value.trim().length === 0) {
    issue(issues, "required", path, "Must be a non-empty string");
  }
}
function optionalDate(issues, value, path) {
  if (value !== void 0 && (!ISO_DATE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)))) {
    issue(issues, "invalid_format", path, "Must be a valid ISO date (YYYY-MM-DD)");
  }
}
function optionalUrl(issues, value, path) {
  if (value === void 0) return;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("invalid protocol");
  } catch {
    issue(issues, "invalid_format", path, "Must be an HTTP or HTTPS URL");
  }
}
function validateLocalized(issues, value, path, required = false) {
  if (!value) {
    if (required) issue(issues, "required", path, "At least one localized value is required");
    return;
  }
  const ar = value.ar?.trim();
  const en = value.en?.trim();
  if (!ar && !en) issue(issues, "required", path, "At least one localized value is required");
}
function validateLocation(issues, value, path) {
  if (!value) return;
  if (!COUNTRY_CODE.test(value.countryCode)) {
    issue(issues, "invalid_format", `${path}.countryCode`, "Must be a two-letter uppercase country code");
  }
}
function validateUnique(issues, values, path) {
  const seen = /* @__PURE__ */ new Set();
  values.forEach((value, index) => {
    requiredString(issues, value, `${path}[${index}]`);
    const key = value.trim().toLowerCase();
    if (seen.has(key)) issue(issues, "duplicate", `${path}[${index}]`, "Duplicate value");
    seen.add(key);
  });
}
function validateProfile(profile) {
  const issues = [];
  if (profile.schemaVersion !== PROFILE_SCHEMA_VERSION) {
    issue(issues, "unsupported_schema_version", "schemaVersion", `Must equal ${PROFILE_SCHEMA_VERSION}`);
  }
  requiredString(issues, profile.id, "id");
  requiredString(issues, profile.partyId, "partyId");
  requiredString(issues, profile.displayName, "displayName");
  validateLocalized(issues, profile.headline, "headline");
  validateLocalized(issues, profile.summary, "summary");
  validateLocation(issues, profile.location, "location");
  const ids = [];
  profile.services.forEach((service, index) => {
    const path = `services[${index}]`;
    requiredString(issues, service.id, `${path}.id`);
    ids.push(service.id);
    requiredString(issues, service.category, `${path}.category`);
    validateLocalized(issues, service.name, `${path}.name`, true);
    validateLocalized(issues, service.description, `${path}.description`);
    validateUnique(issues, service.skillTags, `${path}.skillTags`);
  });
  validateIds(issues, ids, "services");
  ids.length = 0;
  profile.experience.forEach((entry, index) => {
    const path = `experience[${index}]`;
    requiredString(issues, entry.id, `${path}.id`);
    ids.push(entry.id);
    validateLocalized(issues, entry.title, `${path}.title`, true);
    validateLocalized(issues, entry.description, `${path}.description`);
    optionalDate(issues, entry.startedOn, `${path}.startedOn`);
    optionalDate(issues, entry.endedOn, `${path}.endedOn`);
    if (entry.startedOn && entry.endedOn && entry.startedOn > entry.endedOn) {
      issue(issues, "inconsistent", `${path}.endedOn`, "Must not precede startedOn");
    }
    if (entry.isCurrent && entry.endedOn) {
      issue(issues, "inconsistent", `${path}.isCurrent`, "Current experience cannot have endedOn");
    }
    validateUnique(issues, entry.skillTags, `${path}.skillTags`);
  });
  validateIds(issues, ids, "experience");
  ids.length = 0;
  profile.portfolio.forEach((entry, index) => {
    const path = `portfolio[${index}]`;
    requiredString(issues, entry.id, `${path}.id`);
    ids.push(entry.id);
    validateLocalized(issues, entry.title, `${path}.title`, true);
    validateLocalized(issues, entry.description, `${path}.description`);
    optionalDate(issues, entry.completedOn, `${path}.completedOn`);
    optionalUrl(issues, entry.url, `${path}.url`);
    validateUnique(issues, entry.skillTags, `${path}.skillTags`);
  });
  validateIds(issues, ids, "portfolio");
  ids.length = 0;
  profile.credentials.forEach((entry, index) => {
    const path = `credentials[${index}]`;
    requiredString(issues, entry.id, `${path}.id`);
    ids.push(entry.id);
    validateLocalized(issues, entry.name, `${path}.name`, true);
    optionalDate(issues, entry.issuedOn, `${path}.issuedOn`);
    optionalDate(issues, entry.expiresOn, `${path}.expiresOn`);
    if (entry.issuedOn && entry.expiresOn && entry.issuedOn > entry.expiresOn) {
      issue(issues, "inconsistent", `${path}.expiresOn`, "Must not precede issuedOn");
    }
    optionalUrl(issues, entry.verificationUrl, `${path}.verificationUrl`);
  });
  validateIds(issues, ids, "credentials");
  optionalDate(issues, profile.availability.availableFrom, "availability.availableFrom");
  if (profile.availability.hoursPerWeek !== void 0 && (profile.availability.hoursPerWeek < 0 || profile.availability.hoursPerWeek > 168)) {
    issue(issues, "out_of_range", "availability.hoursPerWeek", "Must be between 0 and 168");
  }
  profile.availability.locations.forEach((entry, index) => {
    validateLocation(issues, entry, `availability.locations[${index}]`);
  });
  validateUnique(issues, profile.availability.engagementModes, "availability.engagementModes");
  if (profile.contact.email !== void 0 && !EMAIL.test(profile.contact.email)) {
    issue(issues, "invalid_format", "contact.email", "Must be a valid email address");
  }
  optionalUrl(issues, profile.contact.website, "contact.website");
  optionalUrl(issues, profile.contact.linkedin, "contact.linkedin");
  if (profile.socialLinks) {
    for (const [platform, url] of Object.entries(profile.socialLinks)) {
      optionalUrl(issues, url, `socialLinks.${platform}`);
    }
  }
  const preferences2 = profile.matchingPreferences;
  validateUnique(issues, preferences2.serviceCategories, "matchingPreferences.serviceCategories");
  validateUnique(issues, preferences2.skillTags, "matchingPreferences.skillTags");
  validateUnique(issues, preferences2.sectors, "matchingPreferences.sectors");
  validateUnique(issues, preferences2.engagementModes, "matchingPreferences.engagementModes");
  preferences2.preferredLocations.forEach((entry, index) => {
    validateLocation(issues, entry, `matchingPreferences.preferredLocations[${index}]`);
  });
  if (preferences2.minimumBudgetSar !== void 0 && preferences2.minimumBudgetSar < 0) {
    issue(issues, "out_of_range", "matchingPreferences.minimumBudgetSar", "Must not be negative");
  }
  if (preferences2.maximumBudgetSar !== void 0 && preferences2.maximumBudgetSar < 0) {
    issue(issues, "out_of_range", "matchingPreferences.maximumBudgetSar", "Must not be negative");
  }
  if (preferences2.minimumBudgetSar !== void 0 && preferences2.maximumBudgetSar !== void 0 && preferences2.minimumBudgetSar > preferences2.maximumBudgetSar) {
    issue(
      issues,
      "inconsistent",
      "matchingPreferences.maximumBudgetSar",
      "Must be greater than or equal to minimumBudgetSar"
    );
  }
  if (profile.kind === "individual") {
    requiredString(issues, profile.individual.fullName, "individual.fullName");
    if (profile.individual.yearsOfExperience !== void 0 && (profile.individual.yearsOfExperience < 0 || profile.individual.yearsOfExperience > 100)) {
      issue(issues, "out_of_range", "individual.yearsOfExperience", "Must be between 0 and 100");
    }
    validateUnique(issues, profile.individual.languages, "individual.languages");
  } else {
    requiredString(issues, profile.company.legalName, "company.legalName");
    if (profile.company.foundedYear !== void 0 && (!Number.isInteger(profile.company.foundedYear) || profile.company.foundedYear < 1800 || profile.company.foundedYear > 9999)) {
      issue(issues, "out_of_range", "company.foundedYear", "Must be an integer between 1800 and 9999");
    }
    validateUnique(issues, profile.company.sectors, "company.sectors");
  }
  return { valid: issues.length === 0, issues };
}
function validateIds(issues, values, section) {
  const seen = /* @__PURE__ */ new Set();
  values.forEach((value, index) => {
    if (seen.has(value)) issue(issues, "duplicate", `${section}[${index}].id`, "Duplicate id in section");
    seen.add(value);
  });
}
function assertValidProfile(profile) {
  const result = validateProfile(profile);
  if (!result.valid) {
    const detail = result.issues.map((entry) => `${entry.path}: ${entry.message}`).join("; ");
    throw new TypeError(`Invalid canonical profile: ${detail}`);
  }
  return profile;
}

// src/normalize.ts
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asRecord(value) {
  return isRecord(value) ? value : {};
}
function first(record, keys) {
  for (const key of keys) {
    if (record[key] !== void 0 && record[key] !== null) return record[key];
  }
  return void 0;
}
function text(value) {
  if (typeof value !== "string") return void 0;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : void 0;
}
function numberValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : void 0;
  }
  return void 0;
}
function booleanValue(value, fallback) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0) return false;
  return fallback;
}
function strings(value) {
  if (typeof value === "string") {
    return unique(value.split(",").map((item) => item.trim()).filter(Boolean));
  }
  if (!Array.isArray(value)) return [];
  return unique(value.map(text).filter((item) => item !== void 0));
}
function unique(values) {
  return [...new Set(values)];
}
function localized(value) {
  const scalar = text(value);
  if (scalar) return { en: scalar };
  const record = asRecord(value);
  const ar = text(first(record, ["ar", "arabic", "nameAr", "titleAr"]));
  const en = text(first(record, ["en", "english", "nameEn", "titleEn"]));
  return ar || en ? { ...ar ? { ar } : {}, ...en ? { en } : {} } : void 0;
}
function location(value) {
  const record = asRecord(value);
  const countryCode = text(first(record, ["countryCode", "country_code", "country"]))?.toUpperCase();
  if (!countryCode) return void 0;
  const region = text(first(record, ["region", "province", "state"]));
  const city = text(record.city);
  return {
    countryCode,
    ...region ? { region } : {},
    ...city ? { city } : {}
  };
}
function itemId(record, prefix, index) {
  return text(first(record, ["id", "_id"])) ?? `${prefix}-${index + 1}`;
}
function services(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    const record = asRecord(entry);
    const scalar = text(entry);
    const name = localized(first(record, ["name", "title", "label"])) ?? (scalar ? { en: scalar } : void 0);
    const category = text(first(record, ["category", "categoryId", "type"])) ?? scalar;
    if (!name || !category) return [];
    const description = localized(first(record, ["description", "summary"]));
    const proficiency = first(record, ["proficiency", "level"]);
    return [{
      id: itemId(record, "service", index),
      category,
      name,
      ...description ? { description } : {},
      skillTags: strings(first(record, ["skillTags", "skills", "tags"])),
      ...proficiency === "basic" || proficiency === "intermediate" || proficiency === "advanced" || proficiency === "expert" ? { proficiency } : {}
    }];
  });
}
function experience(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    const record = asRecord(entry);
    const title = localized(first(record, ["title", "role", "position"]));
    if (!title) return [];
    const organization = text(first(record, ["organization", "company", "employer"]));
    const sector = text(first(record, ["sector", "industry"]));
    const description = localized(first(record, ["description", "summary"]));
    const startedOn = text(first(record, ["startedOn", "startDate", "from"]));
    const endedOn = text(first(record, ["endedOn", "endDate", "to"]));
    return [{
      id: itemId(record, "experience", index),
      title,
      ...organization ? { organization } : {},
      ...sector ? { sector } : {},
      ...description ? { description } : {},
      ...startedOn ? { startedOn } : {},
      ...endedOn ? { endedOn } : {},
      isCurrent: booleanValue(first(record, ["isCurrent", "current"]), !endedOn),
      skillTags: strings(first(record, ["skillTags", "skills", "tags"]))
    }];
  });
}
function portfolio(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    const record = asRecord(entry);
    const title = localized(first(record, ["title", "name"]));
    if (!title) return [];
    const description = localized(first(record, ["description", "summary"]));
    const sector = text(first(record, ["sector", "industry"]));
    const completedOn = text(first(record, ["completedOn", "completionDate", "date"]));
    const url = text(first(record, ["url", "link"]));
    return [{
      id: itemId(record, "portfolio", index),
      title,
      ...description ? { description } : {},
      ...sector ? { sector } : {},
      ...completedOn ? { completedOn } : {},
      ...url ? { url } : {},
      skillTags: strings(first(record, ["skillTags", "skills", "tags"]))
    }];
  });
}
function credentials(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    const record = asRecord(entry);
    const name = localized(first(record, ["name", "title", "certificate"]));
    if (!name) return [];
    const rawStatus = first(record, ["status", "state"]);
    const status = rawStatus === "expired" || rawStatus === "pending" || rawStatus === "revoked" ? rawStatus : "active";
    const issuer = text(first(record, ["issuer", "authority", "institution"]));
    const credentialType = text(first(record, ["credentialType", "type", "category"]));
    const issuedOn = text(first(record, ["issuedOn", "issueDate"]));
    const expiresOn = text(first(record, ["expiresOn", "expiryDate"]));
    const verificationUrl = text(first(record, ["verificationUrl", "url"]));
    return [{
      id: itemId(record, "credential", index),
      name,
      ...issuer ? { issuer } : {},
      ...credentialType ? { credentialType } : {},
      status,
      ...issuedOn ? { issuedOn } : {},
      ...expiresOn ? { expiresOn } : {},
      ...verificationUrl ? { verificationUrl } : {}
    }];
  });
}
function engagementModes(value) {
  return strings(value).filter(
    (mode) => mode === "onsite" || mode === "remote" || mode === "hybrid"
  );
}
function availability(value) {
  const record = asRecord(value);
  const rawStatus = first(record, ["status", "availabilityStatus"]);
  const status = rawStatus === "limited" || rawStatus === "unavailable" ? rawStatus : "available";
  const availableFrom = text(first(record, ["availableFrom", "startDate"]));
  const hoursPerWeek = numberValue(first(record, ["hoursPerWeek", "weeklyHours", "capacity"]));
  const rawLocations = first(record, ["locations", "preferredLocations"]);
  const locations = Array.isArray(rawLocations) ? rawLocations.map(location).filter((item) => item !== void 0) : [];
  return {
    status,
    ...availableFrom ? { availableFrom } : {},
    ...hoursPerWeek !== void 0 ? { hoursPerWeek } : {},
    engagementModes: engagementModes(first(record, ["engagementModes", "workModes", "modes"])),
    locations
  };
}
function visibility(value) {
  const record = asRecord(value);
  return {
    email: booleanValue(first(record, ["email", "showEmail"]), false),
    phone: booleanValue(first(record, ["phone", "showPhone"]), false),
    website: booleanValue(first(record, ["website", "showWebsite"]), false),
    linkedin: booleanValue(first(record, ["linkedin", "showLinkedin"]), false),
    socialLinks: booleanValue(first(record, ["socialLinks", "showSocialLinks"]), false)
  };
}
function socialLinks(value) {
  const record = asRecord(value);
  const facebook = text(first(record, ["facebook", "facebookUrl"]));
  const x = text(first(record, ["x", "twitter", "xUrl", "twitterUrl"]));
  const instagram = text(first(record, ["instagram", "instagramUrl"]));
  const youtube = text(first(record, ["youtube", "youtubeUrl"]));
  const github = text(first(record, ["github", "githubUrl"]));
  const behance = text(first(record, ["behance", "behanceUrl"]));
  return {
    ...facebook ? { facebook } : {},
    ...x ? { x } : {},
    ...instagram ? { instagram } : {},
    ...youtube ? { youtube } : {},
    ...github ? { github } : {},
    ...behance ? { behance } : {}
  };
}
function preferences(value) {
  const record = asRecord(value);
  const rawLocations = first(record, ["preferredLocations", "locations"]);
  const preferredLocations = Array.isArray(rawLocations) ? rawLocations.map(location).filter((item) => item !== void 0) : [];
  const minimumBudgetSar = numberValue(first(record, ["minimumBudgetSar", "minBudget", "minimumBudget"]));
  const maximumBudgetSar = numberValue(first(record, ["maximumBudgetSar", "maxBudget", "maximumBudget"]));
  return {
    enabled: booleanValue(first(record, ["enabled", "matchingEnabled"]), true),
    serviceCategories: strings(first(record, ["serviceCategories", "categories"])),
    skillTags: strings(first(record, ["skillTags", "skills"])),
    sectors: strings(first(record, ["sectors", "industries"])),
    preferredLocations,
    engagementModes: engagementModes(first(record, ["engagementModes", "workModes"])),
    ...minimumBudgetSar !== void 0 ? { minimumBudgetSar } : {},
    ...maximumBudgetSar !== void 0 ? { maximumBudgetSar } : {}
  };
}
function inferKind(record) {
  const candidate = text(first(record, ["kind", "type", "profileType", "accountType"]))?.toLowerCase();
  if (candidate === "company" || candidate === "business" || candidate === "organization") return "company";
  if (isRecord(record.company) || text(first(record, ["legalName", "companyName", "commercialRegistrationNumber"]))) {
    return "company";
  }
  return "individual";
}
function normalizeLegacyProfile(input) {
  const root = asRecord(input);
  const nested = asRecord(first(root, ["profile", "profileData", "details"]));
  const source = { ...root, ...nested };
  const kind = inferKind(source);
  const id = text(first(source, ["id", "profileId", "_id"])) ?? "legacy-profile";
  const partyId = text(first(source, ["partyId", "ownerPartyId", "userId", "companyId"])) ?? `party-${id}`;
  const displayName = text(first(source, ["displayName", "name", "fullName", "companyName", "legalName"])) ?? "Unnamed profile";
  const localeValue = first(source, ["locale", "language"]);
  const locale = localeValue === "ar-SA" || localeValue === "ar" ? "ar-SA" : "en-SA";
  const headline = localized(first(source, ["headline", "title", "tagline"]));
  const summary = localized(first(source, ["summary", "bio", "about", "description"]));
  const sourceLocation = location(first(source, ["location", "address"]));
  const contactRecord = asRecord(first(source, ["contact", "contactInfo"]));
  const email = text(first(contactRecord, ["email", "emailAddress"])) ?? text(first(source, ["email", "emailAddress"]));
  const phone = text(first(contactRecord, ["phone", "phoneNumber", "mobile"])) ?? text(first(source, ["phone", "phoneNumber", "mobile"]));
  const website = text(first(contactRecord, ["website", "websiteUrl"])) ?? text(source.website);
  const linkedin = text(first(contactRecord, ["linkedin", "linkedinUrl"])) ?? text(source.linkedin);
  const normalizedSocialLinks = socialLinks(
    first(source, ["socialLinks", "socialMedia", "socialProfiles"]) ?? source
  );
  const base = {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    id,
    partyId,
    kind,
    displayName,
    ...headline ? { headline } : {},
    ...summary ? { summary } : {},
    locale,
    ...sourceLocation ? { location: sourceLocation } : {},
    services: services(first(source, ["services", "serviceOfferings", "offerings"])),
    experience: experience(first(source, ["experience", "experiences", "workExperience"])),
    portfolio: portfolio(first(source, ["portfolio", "projects", "portfolioItems"])),
    credentials: credentials(first(source, ["credentials", "certifications", "licenses"])),
    availability: availability(first(source, ["availability", "capacity"])),
    contact: {
      ...email ? { email } : {},
      ...phone ? { phone } : {},
      ...website ? { website } : {},
      ...linkedin ? { linkedin } : {}
    },
    ...Object.keys(normalizedSocialLinks).length > 0 ? { socialLinks: normalizedSocialLinks } : {},
    contactVisibility: visibility(first(source, ["contactVisibility", "visibility", "privacy"])),
    matchingPreferences: preferences(first(source, ["matchingPreferences", "matchPreferences", "preferences"]))
  };
  const profile = kind === "company" ? {
    ...base,
    kind: "company",
    company: normalizeCompany(source, displayName)
  } : {
    ...base,
    kind: "individual",
    individual: normalizeIndividual(source, displayName)
  };
  return { profile, issues: validateProfile(profile).issues };
}
function normalizeIndividual(source, displayName) {
  const record = { ...source, ...asRecord(source.individual) };
  const professionalTitle = text(first(record, ["professionalTitle", "jobTitle", "title"]));
  const yearsOfExperience = numberValue(first(record, ["yearsOfExperience", "experienceYears"]));
  return {
    fullName: text(first(record, ["fullName", "name"])) ?? displayName,
    ...professionalTitle ? { professionalTitle } : {},
    ...yearsOfExperience !== void 0 ? { yearsOfExperience } : {},
    languages: strings(first(record, ["languages", "spokenLanguages"]))
  };
}
function normalizeCompany(source, displayName) {
  const record = { ...source, ...asRecord(source.company) };
  const commercialRegistrationNumber = text(
    first(record, ["commercialRegistrationNumber", "crNumber", "registrationNumber"])
  );
  const organizationType = text(first(record, ["organizationType", "companyType", "businessType"]));
  const foundedYear = numberValue(first(record, ["foundedYear", "yearFounded"]));
  const employeeCountRange = text(first(record, ["employeeCountRange", "companySize", "employees"]));
  return {
    legalName: text(first(record, ["legalName", "companyName", "name"])) ?? displayName,
    ...commercialRegistrationNumber ? { commercialRegistrationNumber } : {},
    ...organizationType ? { organizationType } : {},
    ...foundedYear !== void 0 ? { foundedYear } : {},
    ...employeeCountRange ? { employeeCountRange } : {},
    sectors: strings(first(record, ["sectors", "industries", "industry"]))
  };
}

// src/projections.ts
function copyLocation(value) {
  return {
    countryCode: value.countryCode,
    ...value.region ? { region: value.region } : {},
    ...value.city ? { city: value.city } : {}
  };
}
function copyService(value) {
  return {
    id: value.id,
    category: value.category,
    name: { ...value.name },
    ...value.description ? { description: { ...value.description } } : {},
    skillTags: [...value.skillTags],
    ...value.proficiency ? { proficiency: value.proficiency } : {}
  };
}
function copyExperience(value) {
  return {
    id: value.id,
    title: { ...value.title },
    ...value.organization ? { organization: value.organization } : {},
    ...value.sector ? { sector: value.sector } : {},
    ...value.description ? { description: { ...value.description } } : {},
    ...value.startedOn ? { startedOn: value.startedOn } : {},
    ...value.endedOn ? { endedOn: value.endedOn } : {},
    isCurrent: value.isCurrent,
    skillTags: [...value.skillTags]
  };
}
function copyPortfolio(value) {
  return {
    id: value.id,
    title: { ...value.title },
    ...value.description ? { description: { ...value.description } } : {},
    ...value.sector ? { sector: value.sector } : {},
    ...value.completedOn ? { completedOn: value.completedOn } : {},
    ...value.url ? { url: value.url } : {},
    skillTags: [...value.skillTags]
  };
}
function copyCredential(value) {
  return {
    id: value.id,
    name: { ...value.name },
    ...value.issuer ? { issuer: value.issuer } : {},
    ...value.credentialType ? { credentialType: value.credentialType } : {},
    status: value.status,
    ...value.issuedOn ? { issuedOn: value.issuedOn } : {},
    ...value.expiresOn ? { expiresOn: value.expiresOn } : {},
    ...value.verificationUrl ? { verificationUrl: value.verificationUrl } : {}
  };
}
function copyAvailability(value) {
  return {
    status: value.status,
    ...value.availableFrom ? { availableFrom: value.availableFrom } : {},
    ...value.hoursPerWeek !== void 0 ? { hoursPerWeek: value.hoursPerWeek } : {},
    engagementModes: [...value.engagementModes],
    locations: value.locations.map(copyLocation)
  };
}
function toPublicProfile(profile) {
  const contact = {
    ...profile.contactVisibility.email && profile.contact.email ? { email: profile.contact.email } : {},
    ...profile.contactVisibility.phone && profile.contact.phone ? { phone: profile.contact.phone } : {},
    ...profile.contactVisibility.website && profile.contact.website ? { website: profile.contact.website } : {},
    ...profile.contactVisibility.linkedin && profile.contact.linkedin ? { linkedin: profile.contact.linkedin } : {}
  };
  const base = {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    id: profile.id,
    partyId: profile.partyId,
    kind: profile.kind,
    displayName: profile.displayName,
    ...profile.headline ? { headline: { ...profile.headline } } : {},
    ...profile.summary ? { summary: { ...profile.summary } } : {},
    locale: profile.locale,
    ...profile.location ? { location: copyLocation(profile.location) } : {},
    services: profile.services.map(copyService),
    experience: profile.experience.map(copyExperience),
    portfolio: profile.portfolio.map(copyPortfolio),
    credentials: profile.credentials.map(copyCredential),
    availability: copyAvailability(profile.availability),
    contact,
    ...profile.contactVisibility.socialLinks && profile.socialLinks ? { socialLinks: { ...profile.socialLinks } } : {}
  };
  if (profile.kind === "individual") {
    return {
      ...base,
      kind: "individual",
      individual: {
        fullName: profile.individual.fullName,
        ...profile.individual.professionalTitle ? { professionalTitle: profile.individual.professionalTitle } : {},
        ...profile.individual.yearsOfExperience !== void 0 ? { yearsOfExperience: profile.individual.yearsOfExperience } : {},
        languages: [...profile.individual.languages]
      }
    };
  }
  return {
    ...base,
    kind: "company",
    company: {
      legalName: profile.company.legalName,
      ...profile.company.organizationType ? { organizationType: profile.company.organizationType } : {},
      ...profile.company.foundedYear !== void 0 ? { foundedYear: profile.company.foundedYear } : {},
      ...profile.company.employeeCountRange ? { employeeCountRange: profile.company.employeeCountRange } : {},
      sectors: [...profile.company.sectors]
    }
  };
}
function sortedUnique(values) {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort(
    (left, right) => left.localeCompare(right)
  );
}
function copyMatchingLocation(value) {
  return {
    countryCode: value.countryCode,
    ...value.region ? { region: value.region } : {}
  };
}
function toMatchingProfileSnapshot(profile) {
  const serviceCategories = sortedUnique([
    ...profile.services.map((service) => service.category),
    ...profile.matchingPreferences.serviceCategories
  ]);
  const skillTags = sortedUnique([
    ...profile.services.flatMap((service) => service.skillTags),
    ...profile.experience.flatMap((entry) => entry.skillTags),
    ...profile.portfolio.flatMap((entry) => entry.skillTags),
    ...profile.matchingPreferences.skillTags
  ]);
  const sectors = sortedUnique([
    ...profile.experience.flatMap((entry) => entry.sector ? [entry.sector] : []),
    ...profile.portfolio.flatMap((entry) => entry.sector ? [entry.sector] : []),
    ...profile.kind === "company" ? profile.company.sectors : [],
    ...profile.matchingPreferences.sectors
  ]);
  const credentialTypes = sortedUnique(
    profile.credentials.flatMap((entry) => entry.credentialType ? [entry.credentialType] : [])
  );
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    kind: profile.kind,
    serviceCategories,
    skillTags,
    sectors,
    credentialTypes,
    ...profile.kind === "individual" && profile.individual.yearsOfExperience !== void 0 ? { yearsOfExperience: profile.individual.yearsOfExperience } : {},
    availabilityStatus: profile.availability.status,
    ...profile.availability.hoursPerWeek !== void 0 ? { hoursPerWeek: profile.availability.hoursPerWeek } : {},
    engagementModes: sortedUnique(profile.availability.engagementModes),
    ...profile.location ? { locationCountryCode: profile.location.countryCode } : {},
    ...profile.location?.region ? { locationRegion: profile.location.region } : {},
    matchingPreferences: {
      enabled: profile.matchingPreferences.enabled,
      serviceCategories: [...profile.matchingPreferences.serviceCategories],
      skillTags: [...profile.matchingPreferences.skillTags],
      sectors: [...profile.matchingPreferences.sectors],
      preferredLocations: profile.matchingPreferences.preferredLocations.map(copyMatchingLocation),
      engagementModes: [...profile.matchingPreferences.engagementModes],
      ...profile.matchingPreferences.minimumBudgetSar !== void 0 ? { minimumBudgetSar: profile.matchingPreferences.minimumBudgetSar } : {},
      ...profile.matchingPreferences.maximumBudgetSar !== void 0 ? { maximumBudgetSar: profile.matchingPreferences.maximumBudgetSar } : {}
    }
  };
}
export {
  PROFILE_SCHEMA_VERSION,
  assertValidProfile,
  normalizeLegacyProfile,
  toMatchingProfileSnapshot,
  toPublicProfile,
  validateProfile
};
