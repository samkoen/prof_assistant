/** Vrai quand une génération vient de se terminer : le solde a pu changer côté serveur. */
export function shouldRefreshBalance(wasGenerating: boolean, generating: boolean): boolean {
  return wasGenerating && !generating;
}
