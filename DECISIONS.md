# Décisions produit — Assistant AI (`assistant-ai`)

Document de référence : choix validés **au début du projet** (questionnaire initial), avant et pendant l’implémentation.  
But : ne pas perdre les règles métier, les défauts et les corrections importantes.

> **Référence modèle** : architecture proche de **digestic-projet1** (API Python, React, PostgreSQL).

---

## 1. Vision du projet

- **Assistant AI pour le professeur pendant le cours** : aide en temps réel (QCM, suivi des élèves, activation en classe).
- Les profs créent, activent en classe, corrigent et suivent les notes.
- **Interface entièrement en hébreu + RTL** ; contenu pédagogique **libre** (pas imposé en hébreu) ; **saisie des examens en RTL**.
- Nom affiché : **עוזר AI** (Assistant AI) — repo / technique : **`assistant-ai`** ; base PostgreSQL : **`assistant_ai`**.

---

## 2. Stack technique

| Couche | Décision |
|--------|----------|
| Frontend | **React + TypeScript + Vite** |
| UI | **Material UI (MUI)** avec support RTL |
| Backend | **FastAPI** |
| Base de données | **PostgreSQL** |
| Auth | **Cookies httpOnly** (`assistant_session`) — pas de JWT dans `localStorage` ; `credentials: 'include'` côté front |
| Durée de session | **Élève : 7 jours** — **Prof / Admin : 30 jours** |
| Déploiement cible | **Vercel** (front + API serverless) + **Neon** (PostgreSQL) |
| Dev local | **PostgreSQL installé en local** (pas Neon en dev) |
| Emails (v1+) | **Resend** prévu ; abstraction pour changer de fournisseur |
| Échelle v1 | ~**50–200** utilisateurs (une école / quelques classes) |

---

## 3. Rôles et permissions

### Administrateur

- **Voit tout** : profs, élèves, cours.
- **Gestion complète** : CRUD comptes, structure, réaffectation de cours, fermeture de cours.
- **Réinitialisation mot de passe**, **blocage de compte**.
- Peut créer des cours (y compris pour un prof donné).

### Enseignant

- Voit **uniquement ses élèves** et **ses cours**.
- Crée librement **matière**, **classe** et **cours** pour lui-même.
- Crée / active / ferme les examens ; consulte résultats et stats.
- Peut **ajouter** et **retirer** des élèves sur ses cours.
- Peut **créer des élèves** dans le système (`POST /api/students`).
- Peut **réinitialiser le MDP** de ses élèves.
- Peut **valider un élève sans confirmation email** (bypass explicite en classe).
- **Flexibilité générale** : réouverture d’envoi, prolongation, gestion au cas par cas.

### Élève

- Tableau de bord : cours, examens actifs, notes, notifications.
- Peut **s’inscrire seul** à un cours (en plus des comptes créés par admin/prof).

---

## 4. Comptes et authentification

- Connexion : **email + mot de passe** (tous les rôles).
- Création d’élève : **deux chemins** — par **admin/prof** **et** **auto-inscription** par l’élève.
- Auto-inscription : **confirmation email obligatoire** avant première connexion — **sauf** validation manuelle par le prof (`verify-email-bypass`).
- Mot de passe : **simple en v1** (minimum **6 caractères**).
- Réinitialisation MDP : **admin + prof** — **pas** de « mot de passe oublié » self-service en v1.
- Profil : **nom + email + mot de passe** obligatoires ; **photo**, **téléphone**, **numéro scolaire** : **optionnels** (numéro scolaire surtout pour les élèves).

---

## 5. Cours et inscriptions

### Modèle

- Entité centrale : **Cours** = enseignant + matière + classe.
- Un élève peut être dans **plusieurs cours** ; un prof peut avoir **plusieurs cours** (même matière, classes différentes).

### Inscription élève

- **Liste de cours** disponibles + bouton **« Rejoindre »**.
- **Validation par le prof** obligatoire avant accès.
- Tant que la demande est **en attente** : l’élève **ne voit pas** le cours ni ses examens.
- Le prof peut **ajouter directement** un élève au cours (statut **approuvé** immédiatement).

### Visibilité des cours

- Cours **visible par défaut** dans la liste « Rejoindre ».
- Le prof peut rendre le cours **privé / fermé** aux nouvelles inscriptions (`is_open_enrollment`).

### « Fermer une classe / cours »

- **Ne bloque pas** l’ajout d’**élèves** ni de **examens** par le prof.
- Vise surtout le **côté élève** (ex. plus de demandes « Rejoindre » via la liste publique).
- Libellé et effets UI précis : **à affiner** au design.

---

## 6. Examens et QCM

### Types de questions (v1)

- **Choix unique**
- **Choix multiple**
- **Vrai / faux**

### Cycle de vie d’un examen

- **Brouillon** : édition libre tant que l’examen **n’est pas activé**.
- Après **activation** : contenu en **lecture seule**.
- **Duplication** d’un examen pour une nouvelle session.

### Activation et durée

- **Pas de date de début planifiée** : le prof **active manuellement** en classe.
- **Durée fixée** pour l’examen.
- Le **chrono démarre** quand l’élève **ouvre** l’examen (première fois).
- À l’expiration : l’élève **ne peut plus envoyer** — le prof peut **rouvrir** la possibilité d’envoyer.

### Tentatives (décision corrigée)

> Initialement : tentatives configurables, meilleure note par défaut.  
> **Correction validée** :

- **Une seule tentative** par élève et par examen.
- Le prof peut **rouvrir** manuellement → la **nouvelle soumission remplace** l’ancienne (**une seule note finale**).

### Reprise et session

- **Reprise possible** après coupure : état conservé, **temps restant côté serveur** (le chrono ne repart pas à zéro).
- **Un seul onglet actif** : second onglet **bloqué** avec message.

### Fin du temps (élève)

- **Avertissement** avant la fin : **10 minutes par défaut**, **configurable par examen**.
- À l’expiration : **soumission automatique** des réponses partielles **par défaut** — **configurable par examen**.

### Mélange (anti-triche)

- **Mélange des questions** et **des options** : **configurable par examen**.
- À la création : le prof **choisit obligatoirement** (pas de valeur par défaut imposée).

---

## 7. Notes, barème et correction

### Calcul des points

- Barème **configurable par le prof** ; **par défaut** : points pour **bonnes réponses uniquement**, **sans pénalité**.
- **Choix multiples** : compter le **nombre de bonnes réponses** ; mode **proportionnel par défaut** (ex. 2/3 du point) ; **configurable par question** (tout ou rien vs proportionnel).

### Visibilité des résultats pour l’élève

- L’élève **ne voit ni note ni correction** tant que l’examen n’est pas terminé pour **toute la classe** **ou** **fermé** explicitement par le prof.
- **Pas** de correction immédiate après chaque soumission individuelle (sauf si le prof ferme au fur et à mesure).

### Publication des résultats

- Affichage par défaut : **note + correction détaillée** — **configurable par examen** (options C + D de la question initiale).
- À la clôture : **tous les élèves** voient **en même temps** note et correction (selon config).

### Fermeture / publication (déclencheurs)

- **Manuelle** : bouton prof « Fermer l’examen » / « Publier les résultats ».
- **Automatique** : lorsque **tous les élèves inscrits** ont soumis.
- Si certains ne soumettent jamais : **seul le prof** peut clôturer.

---

## 8. Statistiques et suivi en direct (v1)

### Statistiques prof

- **Liste des notes** par examen et par élève.
- **Moyennes** par classe / examen.
- **Évolution dans le temps** (graphiques).
- **Analyse par question** (% de réussite).
- **Pas d’export** CSV/Excel en v1 (écran uniquement).

### Pendant l’examen (live)

- Qui a **ouvert** / **soumis**.
- **Progression** (ex. question 3/10) — **sans** voir les réponses.
- **Alerte** quand le **temps est écoulé** pour un élève.

---

## 9. Notifications

- **In-app uniquement** en v1 (badge, liste).
- **Email** (hébreu) : **plus tard** (inscription acceptée, examen disponible, etc.).

---

## 10. Interface (UX)

- **RTL** : direction `rtl`, menu latéral à **droite** (Drawer `anchor="left"` en RTL MUI).
- Contenu principal à **gauche** ; barres d’outils des listes : bouton d’action à **gauche** (premier dans le DOM).
- Inspiration layout : **digestic-projet1** (menu + tableau), adapté hébreu.

---

## 11. Points encore ouverts / v2

| Sujet | Statut |
|-------|--------|
| Libellé exact « fermer un cours » côté UI | À affiner |
| Export notes (CSV/Excel) | v2 |
| « Mot de passe oublié » par email | v2 |
| Notifications email | v2 |
| SSO (Google, Microsoft) | Hors v1 |
| Règles « meilleure note / moyenne / dernière tentative » | Remplacées par **1 tentative + remplacement** |

---

## 12. Notes d’implémentation (rappel)

- Structure : `backend/` (Python, `app.*`), `frontend/`, `api/` (entrée Vercel).
- Pas de package Python nommé `backend` — imports `from app.xxx`.
- Venv dans `backend/.venv`.
- Admin seed dev : `admin@assistant-ai.local` / `admin123` (emails `.local` autorisés en dev via `AppEmail`).

---

*Dernière mise à jour : mai 2026 — à compléter si de nouvelles décisions sont prises en conversation.*
