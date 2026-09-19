# HomoHumanicus — strona wellness z chatbotem AI

Statyczna strona HomoHumanicus z chatbotem opartym na bazie wiedzy (RAG).

## Struktura

- `index.html`, `cennik.html`, `certyfikaty.html`, `formularz-wellness.html` — strony
- `script.js` — widget chatbota (RAG: baza wiedzy + konfigurowalny LLM)
- `baza/` — baza wiedzy (25 plików `.md`)
- `baza-index.json` — indeks wyszukiwania (generowany)
- `build-knowledge-index.js` — generator indeksu z plików `baza/`

## Chatbot

Chatbot odpowiada na pytania, łącząc bazę wiedzy (kontekst ekspercki) z modelem LLM.

- Kliknij ikonę czatu w prawym dolnym rogu.
- Kliknij ⚙, aby podłączyć własne API modelu (Gemini, OpenAI, OpenRouter,
  Perplexity, Groq lub dowolny endpoint zgodny z OpenAI).
- Klucz API jest przechowywany **tylko w pamięci sesji** i znika po zamknięciu czatu.

## Aktualizacja bazy wiedzy

1. Dodaj lub zmień pliki `.md` w folderze `baza/`.
2. Uruchom: `node build-knowledge-index.js`
3. Zacommituj i wypchnij zmiany — Vercel wdroży automatycznie.

## Wdrożenie

Hostowane na Vercel: https://homohumanicus-wellness.vercel.app

Każdy push do gałęzi `main` uruchamia automatyczne wdrożenie.
