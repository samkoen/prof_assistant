# Assistant AI (עוזר AI)

Assistant pour le professeur pendant le cours — QCM en temps réel, suivi des élèves, interface en hébreu (RTL).

**Décisions produit (questionnaire initial)** : voir [DECISIONS.md](./DECISIONS.md).

## Structure

```
assistant-ai/
├── backend/           # API FastAPI (tout le Python ici)
│   ├── .venv/         # environnement virtuel (dev)
│   ├── .env           # config locale
│   ├── app/           # code applicatif (import: app.*)
│   ├── scripts/       # init_db, seed_admin
│   ├── alembic/
│   └── requirements.txt
├── frontend/          # React + Vite
└── api/               # entrée Vercel serverless
```

## Stack

- **Frontend** : React, TypeScript, Vite, MUI (RTL)
- **Backend** : FastAPI, SQLAlchemy, PostgreSQL local (dev)
- **Auth** : cookie httpOnly `assistant_session`

## Démarrage local

### 1. Base PostgreSQL

```powershell
.\scripts\setup-local-db.ps1
```

Ou manuellement :

```sql
CREATE DATABASE assistant_ai;
```

### 2. Backend

```powershell
cd backend
copy .env.example .env
# Éditer .env : mot de passe postgres

python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

python -m scripts.init_db
python -m scripts.seed_admin
python run.py
```

Raccourci :

```powershell
cd backend
.\run-dev.ps1
```

Admin : `admin@assistant-ai.local` / `admin123`

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

→ http://localhost:5173

## Alembic (depuis `backend/`)

```powershell
cd backend
.\.venv\Scripts\alembic.exe upgrade head
```

## Notes

- **Plus de module `backend`** : les imports sont `from app.xxx import ...`
- Le venv doit être dans **`backend/.venv`**, pas à la racine
- Si vous aviez une ancienne base `mivchan_chai`, créez `assistant_ai` (script ci-dessus) et mettez à jour `DATABASE_URL` dans `.env`
- Renommer le dossier du repo en `assistant-ai` est recommandé mais optionnel
