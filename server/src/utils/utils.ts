type DomainVerificationSnapshot = { verifiedAt: Date | null } | null;

/**
 * Flattens a CityCreationRequest row that selects `domainVerification.verifiedAt`
 * back into the flat `domainVerifiedAt` field expected by API consumers.
 */
export function withDomainVerifiedAt<
  T extends { domainVerification: DomainVerificationSnapshot },
>(row: T): Omit<T, 'domainVerification'> & { domainVerifiedAt: Date | null } {
  const { domainVerification, ...rest } = row;
  return { ...rest, domainVerifiedAt: domainVerification?.verifiedAt ?? null };
}
