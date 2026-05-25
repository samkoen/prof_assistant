export function buildJoinCourseUrl(offeringId: number): string {
  const base = window.location.origin;
  return `${base}/join/${offeringId}`;
}

export function joinRedirectPath(offeringId: number): string {
  return `/join/${offeringId}`;
}

export function authPathWithJoin(mode: "login" | "register", offeringId: number): string {
  return `/${mode}?join=${offeringId}`;
}
