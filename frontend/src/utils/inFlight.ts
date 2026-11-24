const pending = new Map<string, Promise<unknown>>();

/**
 * Partage une requête déjà en cours : deux appels simultanés avec la même clé
 * (double montage React, double clic) ne déclenchent qu'un seul appel réseau.
 */
export function shareInFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const current = pending.get(key) as Promise<T> | undefined;
  if (current) return current;
  const started = run().finally(() => pending.delete(key));
  pending.set(key, started);
  return started;
}
