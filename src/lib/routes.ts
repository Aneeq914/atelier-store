// URL builders shared by server queries and client components.

export const SEARCH_HREF = "/search";

export const SIGN_IN_HREF = "/sign-in";
export const SIGN_UP_HREF = "/sign-up";
export const ACCOUNT_HREF = "/account";
export const ACCOUNT_DETAILS_HREF = "/account/details";
export const BAG_HREF = "/bag";
export const ADMIN_HREF = "/admin";

/** A fixed route, so no category may use the slug "new". */
export const NEW_ARRIVALS_HREF = "/collections/new";

export function categoryHref(slug: string) {
  return `/collections/${slug}`;
}
