# Operation Planner – Frontend (uFE)

Micro front-end pre plánovanie operácií, správu operačných sál, pacientov a zdravotníckeho personálu.

## Technológie

- **Stencil 4** – Web Components framework
- **Material Web 1.5** – Material Design 3 komponenty
- **TypeScript**
- **OpenAPI Generator** – automaticky generovaný API klient z `api/or-planner.openapi.yaml`

## Lokálny vývoj

### Požiadavky

- Node.js 20+
- npm
- Docker (pre generovanie API klienta)
- Bežiaci backend alebo mock API

### Inštalácia závislostí

```bash
npm install
```

### Spustenie s mock API

Spustí lokálny mock server (port `5000`) aj dev server aplikácie súčasne:

```bash
npm start
```

- Aplikácia: `http://localhost:3333`
- Mock API: `http://localhost:5000`

### Spustenie iba dev servera (pri bežiacom BE)

```bash
npm run start:app
```

### Build

```bash
npm run build
```

## Generovanie API klienta

Po zmene OpenAPI špecifikácie (`api/or-planner.openapi.yaml`) je potrebné regenerovať klienta:

```bash
npm run openapi
```

Vygenerovaný kód je v `src/api/or-planner/` — **neupravovať ručne**.

## Štruktúra projektu

```
api/                        # OpenAPI špecifikácia (YAML)
src/
  components/               # Stencil Web Components
    orp-or-app/             # Hlavná aplikácia + routing
    orp-rooms-list/         # Zoznam operačných sál
    orp-room-editor/        # Formulár sály
    orp-operation-list/     # Zoznam operácií sály
    orp-operation-editor/   # Formulár operácie
    orp-patients-list/      # Zoznam pacientov
    orp-patient-editor/     # Formulár pacienta
    orp-staff-list/         # Zoznam personálu
    orp-staff-editor/       # Formulár člena personálu
  api/or-planner/           # Vygenerovaný API klient (nepupravovať)
  global/
    app.ts                  # Importy Material Web + fonty
    navigation.ts           # Polyfill pre Navigation API
build/docker/               # Dockerfile
```

## Komponenty

| Komponent | Popis |
|-----------|-------|
| `orp-or-app` | Koreňový komponent, spravuje routing |
| `orp-rooms-list` | Prehľad operačných sál (karty) |
| `orp-room-editor` | Vytvorenie / úprava sály |
| `orp-operation-list` | Operácie konkrétnej sály |
| `orp-operation-editor` | Naplánowanie / úprava operácie |
| `orp-patients-list` | Prehľad pacientov |
| `orp-patient-editor` | Vytvorenie / úprava / archivácia pacienta |
| `orp-staff-list` | Prehľad zdravotníckeho personálu |
| `orp-staff-editor` | Vytvorenie / úprava člena personálu |

## Docker

### Build

```bash
docker build -f build/docker/Dockerfile -t orp-or-planner-ufe .
```

### Spustenie

```bash
docker run -p 8080:8080 orp-or-planner-ufe
```

Aplikácia beží na `http://localhost:8080`. Backend API je potrebné nakonfigurovať cez atribút `api-base` na elemente `<orp-or-app>` v `index.html`.

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) pri každom push:

1. Nainštaluje závislosti (`npm ci`)
2. Zbuilduje aplikáciu (`npm run build`)
3. Zbuilduje a pushne Docker image na DockerHub

Pri tagu `v1.*` vytvorí aj semver-tagované verzie image (`1.1.0`, `1.1`, `1`, `latest`).

## Autori

Filip Chromek, Dominik Mojto
