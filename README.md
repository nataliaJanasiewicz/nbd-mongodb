# nbd-mongodb

Pełny projekt CRUD z agregacjami MongoDB, zbudowany w oparciu o Express + Mongoose oraz frontend Vue 3 + Vite. Aplikacja zarządza zadaniami, pozwala filtrować/przeglądać statusy i wizualizuje wyniki zapytań agregujących (match ➜ group ➜ sort) bezpośrednio w UI.

## Stos technologiczny

- **Backend**: Node 20+, Express 5, Mongoose 9, Zod do walidacji.
- **Frontend**: Vue 3 (script setup, TypeScript), Vite.
- **Baza**: MongoDB 7 (lokalnie lub przez kontener Docker).
- **Kontenery**: Docker Compose (opcjonalnie) uruchamia MongoDB, API i frontend.

## Wymagania wstępne

- Node.js >= 20 oraz npm.
- Zainstalowany Docker + Docker Compose (dla uruchomienia kontenerowego).
- Lokalny plik `.env` w `backend/` z `MONGO_URL`, oraz `.env` w `frontend/` z `VITE_API_URL`. Przykłady poniżej.

```
# backend/.env
MONGO_URL=mongodb://127.0.0.1:27017/todolist
PORT=3000

# frontend/.env
VITE_API_URL=http://localhost:3000
```

## Instalacja i uruchomienie (lokalnie)

```bash
# 1. Zainstaluj zależności
cd backend && npm install
cd ../frontend && npm install

# 2. Uruchom MongoDB lokalnie (np. docker compose up mongo) albo własną instancję.

# 3. Backend (port 3000)
cd backend
npm run dev         # tryb developerski
npm run build && npm start   # produkcyjnie

# 4. Frontend (port 5173)
cd ../frontend
npm run dev         # dev server Vite
```

### Uruchomienie przez Docker Compose

```bash
docker compose up --build
```

Docker wystawi porty:
- MongoDB: `27017`
- Backend API: `3000`
- Frontend UI: `5173`

## Dane i seedy

Prosty skrypt `backend/src/seed.ts` czyści kolekcję `tasks` i wstawia przykładowe dane (różne statusy/kategorie + `extra` jako dokumenty z dodatkowymi polami). Uruchom:

```bash
cd backend
npm run seed
```

## Struktura katalogów

```
backend/
  src/
    controllers/  # logika HTTP
    services/     # operacje na Mongo (mongoose)
    models/       # schematy i indeksy
    validators/   # walidacja z Zod
    routes/       # definicje tras Express
    seed.ts       # przykładowe dane
frontend/
  src/
    api/          # fetch + typy DTO
    App.vue       # główna tablica z filtrami i statystykami
docker-compose.yml
```

## API backendu

| Metoda | Endpoint | Opis |
| ------ | -------- | ---- |
| `POST` | `/tasks` | Utworzenie zadania (walidacja Zod, `title` wymagany). |
| `GET` | `/tasks` | Lista z filtrami (`q`, `status`, `category`, `priorityMin/Max`, `sort`, `page`, `limit`, `deadlineFrom/To`). |
| `GET` | `/tasks/:id` | Jeden dokument po ID (z walidacją ObjectId). |
| `PATCH` | `/tasks/:id` | Aktualizacja dowolnego podzbioru pól. |
| `DELETE` | `/tasks/:id` | Usunięcie. |
| `GET` | `/tasks/_stats/overview` | Agregacja match ➜ group ➜ project: liczba todo/in_progress/done, overdue, średni priorytet. |
| `GET` | `/tasks/_stats/by-project` | Agregacja match ➜ group ➜ sort po `projectId` (liczba zadań, doneCount, avgPriority). |

Schemat `Task` (`backend/src/models/task.model.ts`) posiada:
- Pola `title`, `description`, `status`, `category`, `priority`, `extra`.
- Indeksy: `status`, `category`, `priority`, tekstowy (title/description/category) dla wyszukiwania full-text.
- `extra` przechowuje dowolny dokument (np. deadline, sklep, lista zakupów), dzięki czemu zachowujemy elastyczność NoSQL.

## Frontend

- Formularz dodawania (+ dynamiczne pola `extra`).
- Tablica Kanban (todo / in_progress / done) z możliwością zmiany statusu i edycji każdego zadania.
- Filtry (wyszukiwarka tekstowa, status, kategoria, sortowanie) z synchronizacją do zapytań API.

Komendy:

| Komenda | Lokalizacja | Efekt |
| ------- | ----------- | ----- |
| `npm run dev` | `backend/` | uruchomienie API z ts-node-dev |
| `npm run build` | `backend/` | kompilacja TypeScript (dist/) |
| `npm start` | `backend/` | start API (po buildzie) |
| `npm run seed` | `backend/` | wygenerowanie przykładowych danych |
| `npm run dev` | `frontend/` | serwer Vite na porcie 5173 |
| `npm run build` | `frontend/` | budowanie produkcyjne |

## Notatki implementacyjne

- Walidacja wejścia jest wykonywana w kontrolerach przez `createTaskSchema` / `updateTaskSchema`. Przy włączeniu `exactOptionalPropertyTypes` upewniono się, że do bazy nie trafiają `undefined`.
- Ekstra pola w formularzu/edycji mapują się na obiekt `extra` w Mongo (dowolne pary klucz/wartość).
- Agregacje korzystają z natywnych pipeline: `$match` na projektach, `$group` z sumami i średnimi, `$sort` po liczbie zadań. Frontend prezentuje dane w panelu statystyk.
- Brak testów automatycznych — zaleca się sprawdzenie ręczne (backend: `npm run build`, frontend: `npm run build`) i wykorzystanie endpointu `/health` do szybkiego sprawdzenia stanu API.