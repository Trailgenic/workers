// The permit alert sign-up, terms, privacy and help pages are served by mysummitcharms.com.
// This Worker only answers the API and sends anyone who lands on its old pages there.
export const SITE_BASE = "https://mysummitcharms.com/permit-alerts/";

const REDIRECTS = Object.freeze({
  "/": SITE_BASE,
  "/privacy": `${SITE_BASE}privacy/`,
  "/terms": `${SITE_BASE}terms/`,
  "/help": `${SITE_BASE}help/`
});

export const publicRedirect = (pathname) => REDIRECTS[pathname] || null;
