# Tuteur AI côté élève — spécification (passation)

Branche : `refonte-ui` (dernier commit : refonte UI + double vérification des réponses).
Objectif : remplacer/compléter l'explication statique des bonnes réponses par un **tuteur conversationnel**
avec lequel l'élève discute, question par question, pour comprendre la réponse.

## 1. Comportement attendu

- Sur l'écran de correction élève, chaque question a un bouton **« להבין את התשובה »**.
  Il ouvre un chat : panneau latéral sur desktop, bottom sheet sur mobile.
- Le tuteur reçoit d'office le contexte (l'élève ne recopie rien) :
  énoncé, options, bonne réponse, **réponse de l'élève**, matière/cours,
  et si disponibles la solution du générateur + le raisonnement de la double vérification (voir §4).
- Pédagogie socratique par défaut :
  1. il commence par demander à l'élève pourquoi il a choisi sa réponse ;
  2. il identifie la confusion précise ;
  3. il donne des indices progressifs ;
  4. un bouton **« תראה לי את ההסבר המלא »** donne l'explication complète à tout moment.
- Boutons de démarrage rapide : « למה התשובה שלי לא נכונה? », « תסביר צעד אחר צעד »,
  « תן לי דוגמה דומה », « תבחן אותי בשאלה דומה » (nouvelle question proche, corrigée dans le chat).
- Questions de code/calcul : le tuteur peut utiliser l'exécution de code Gemini pour montrer
  un déroulé pas à pas (valeurs des variables ligne par ligne).
- Réponses en hébreu, courtes, adaptées au niveau.

## 2. Garde-fous

- **Jamais pendant l'examen** : disponible uniquement quand l'élève peut voir sa correction
  (résultats publiés). Vérification **côté serveur**, pas seulement dans l'UI.
- Activable/désactivable par le prof **par matala** (réglage dans l'éditeur, onglet paramètres).
- Hors sujet refusé : uniquement la question en cours et sa matière.
- Si le tuteur pense que la réponse officielle est fausse : il ne contredit pas frontalement,
  il le dit prudemment et propose **« לדווח למרצה »** → signalement visible par le prof.
- Limites : ~10 messages par question, plafond par élève et par matala (valeurs dans `config.py`).
- L'élève est informé (une ligne) de ce que le prof peut voir de la conversation.
- Le prompt système est un `PromptSpec` éditable dans la page admin des prompts
  (comme `generation.verify`), avec label dans `aiPromptLabels.ts` + `he.ts`.

## 3. Étapes

- **V1** : bouton + chat avec contexte + boutons de démarrage + limites + réglage par matala
  + contrôle serveur « résultats visibles ». Historique stocké en base (table dédiée).
- **V2** : mode socratique complet, « תבחן אותי », exécution de code pour les déroulés.
- **V3** : côté prof, synthèse par matala (questions les plus discutées, confusions fréquentes,
  signalements) + circuit de signalement.

## 4. Ce qui existe déjà et qu'il faut réutiliser

- `backend/app/services/ai_client.py` : `generate_verification(prompt, system=..., code_execution=...)`
  → renvoie `(texte, code_vraiment_exécuté)`, retente sans outil en cas d'erreur.
  S'en inspirer pour un appel multi-tours (le client Gemini est dans `gemini_client.py`, `_chat_body`).
- `unbilled()` (utilisé dans `gemini_answer_check.py`) pour ne pas débiter de crédits.
- Pendant la génération, la série stocke dans `params` :
  - la solution du générateur par question (`strip_solutions` dans `qcm_solutions.py`) ;
  - `params["answer_checks"]` : dict clé = numéro de question (str) → statut, réponses, `reason`, `solution`.
  ⚠️ Vérifier si ces infos sont recopiées sur les questions enregistrées de l'examen ;
  sinon, les stocker sur la question au moment de l'acceptation (sinon le tuteur ne les aura pas).
- Prompts : `backend/app/services/ai_prompt_defaults.py` (`PromptSpec`, `required`, `placeholders`).
- Mocks AI des tests d'intégration : `backend/tests/integration/ai_mocks.py`.

## 5. Règles du projet

- Fonctions ≤ 50 lignes ; textes UI uniquement dans `frontend/src/i18n/he.ts` ; tests pour la logique.
- UI : RTL, MUI, palette du thème (`theme/brand.ts`), composants partagés (`AppPageHeader`, `ActionsMenu`…).
- Tests : frontend `npx tsc -b` + `npx vitest run` ; backend `python -m pytest` (Python global 3.12),
  unitaires + `tests/integration`.
- Ne pas commiter sans accord de l'utilisateur.

## 6. Questions ouvertes (choix par défaut si pas de réponse)

| Question | Défaut proposé |
|---|---|
| Qui paie les échanges ? | Plateforme (`unbilled`), avec limites |
| Le prof voit-il les conversations ? | Non : synthèse anonymisée seulement (V3) |
| Ton par défaut | Socratique, avec bouton d'explication complète |
| Tuteur aussi sur les questions réussies ? | Oui |
