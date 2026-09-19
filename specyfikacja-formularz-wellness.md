# Specyfikacja formularza doboru technologii wellness
**Homo Humanicus — formularz konsultacyjny PEMF/THz**
Plik referencyjny: `formularz-wellness.html`
Wersja: 1.0 · Wrzesień 2026

---

## 1. Kontekst i cel

Formularz zbiera dane od użytkownika w czterech krokach (model 4 pytań K. Andrewsa
zaadaptowany do kontekstu wellness), a następnie:

1. pokazuje podsumowanie na ekranie,
2. pozwala pobrać podsumowanie jako **PDF** (działa już w pełni po stronie klienta),
3. pozwala **dobrowolnie** przesłać ten sam PDF administratorowi projektu na adres
   `januszjankra@gmail.com` (wymaga wdrożenia backendu — patrz sekcja 5).

Formularz **nie jest narzędziem diagnostycznym** — żadne pole, etykieta ani komunikat
nie mogą sugerować diagnozy medycznej. Wszystkie teksty referencyjne w tym dokumencie
należy traktować jako wiążące co do treści (nie tylko struktury).

---

## 2. Struktura kroków i pola

### Krok 1 — Punkt wyjścia (`data-panel="0"`)

| Pole | Typ | Nazwa/`name` | Wartości | Wymagane |
|---|---|---|---|---|
| Energia | skala 1–5 (przyciski) | `energia` (stan JS: `state.scales.energia`) | Bardzo niski…Bardzo dobry | Nie |
| Sen | skala 1–5 | `sen` | Bardzo słaba…Bardzo dobra | Nie |
| Stres | skala 1–5 | `stres` | Minimalny…Bardzo wysoki | Nie |
| Obszary do wsparcia | checkbox multi | `obszary` | mięśnie i stawy / krążenie / koncentracja / regeneracja po wysiłku / odporność na napięcie / ogólna witalność | Nie |

### Krok 2 — Kierunek wsparcia (`data-panel="1"`)

| Pole | Typ | `name` | Wartości |
|---|---|---|---|
| Cel główny | radio | `cel_glowny` | relaks i wyciszenie / regeneracja po wysiłku fizycznym / wsparcie codziennej witalności / regularna rutyna profilaktyczna |
| Częstotliwość | radio | `czestotliwosc` | codziennie krótko / kilka razy w tygodniu / okazjonalnie / nie wiem |
| Dla kogo | radio | `dla_kogo` | dla siebie / dla bliskich / dla podopiecznych / jeszcze nie wiem |

### Krok 3 — Zaangażowanie (`data-panel="2"`)

| Pole | Typ | `name` | Wartości |
|---|---|---|---|
| Czas tygodniowo | radio | `czas` | do 30 min / 30-60 min / 1-3 godziny / ponad 3 godziny |
| Motywacja | textarea (tekst dowolny) | `motywacja` | tekst swobodny |
| Doświadczenie | radio | `doswiadczenie` | tak, regularnie / tak, sporadycznie / nie, to pierwszy raz |

### Krok 4 — Bezpieczeństwo i kontakt (`data-panel="3"`)

| Pole | Typ | `name` / `id` | Wartości | Wymagane |
|---|---|---|---|---|
| Przeciwwskazania | checkbox multi | `przeciwwskazania` | rozrusznik/implant / ciaza / padaczka / stan ostry / onkologia | Nie |
| Opieka lekarska | radio | `opieka_lekarska` | tak / nie | Nie |
| Imię (kontakt) | text | `#kontakt_imie` | dowolny tekst | Nie |
| E-mail (kontakt) | text | `#kontakt_email` | e-mail | Nie — zalecana walidacja formatu przed produkcją |
| Potwierdzenie 1 (charakter wellness, nie medyczny) | checkbox | `#ack1` | — | **Tak**, blokuje przejście dalej |
| Potwierdzenie 2 (konsultacja lekarska przy przeciwwskazaniach) | checkbox | `#ack2` | — | **Tak**, blokuje przejście dalej |

> **Uwaga walidacyjna:** oba potwierdzenia (`ack1`, `ack2`) są obecnie wymagane do
> przejścia z kroku 4 do podsumowania — logika w funkcji `nextBtn` (`if(!ack1 || !ack2)`).
> Rekomendacja: w wersji produkcyjnej dodać też prostą walidację formatu e-maila
> (regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`), jeśli pole `kontakt_email` nie jest puste.

### Krok 5 — Podsumowanie i wysyłka (`data-panel="4"`)

| Element | Typ | `id` | Opis |
|---|---|---|---|
| Zgoda na przesłanie do administratora | checkbox | `#consentSend` | **Dobrowolna.** Niezaznaczenie nie blokuje korzystania z formularza — blokuje tylko przycisk „Wyślij do administratora”. |
| Pobierz PDF | button | `#downloadPdfBtn` | Generuje PDF lokalnie (jsPDF) i zapisuje na urządzeniu użytkownika. W pełni funkcjonalne bez backendu. |
| Wyślij do administratora | button | `#sendAdminBtn` | Próbuje wysłać PDF na backend (sekcja 5); w razie braku endpointu — fallback opisany niżej. |
| Status wysyłki | tekst | `#sendStatus` | Komunikat zwrotny dla użytkownika. |

---

## 3. Generowanie PDF (już zaimplementowane, client-side)

- Biblioteka: **jsPDF** (`https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`).
- Funkcja `buildPdfDoc()` składa dokument A4 z sekcjami: Punkt wyjścia, Kierunek
  wsparcia, Zaangażowanie, Bezpieczeństwo, Dane kontaktowe, oraz stały akapit
  z zastrzeżeniem (disclaimer) — **treść zastrzeżenia nie powinna być skracana ani
  usuwana w żadnej wersji produkcyjnej**.
- `#downloadPdfBtn` → `doc.save('raport-wellness-homohumanicus.pdf')`.
- Do wysyłki: `doc.output('datauristring')` → wycięty base64 (bez prefiksu
  `data:application/pdf;base64,`).

Deweloper nie musi nic zmieniać w tej części, chyba że zmieni się układ pól formularza
— wtedy trzeba zaktualizować `buildPdfDoc()` analogicznie do zmian w krokach 1–4.

---

## 4. Umieszczenie linku w sekcji „02 Konsultacja i dobór”

W `index.html`, w bloku `.steps-list`, drugi punkt (`<span>02</span>`) zawiera teraz
dodatkowy link:

```html
<li><span>02</span>
  <div>
    <h3>Konsultacja i dobór</h3>
    <p>Wspólnie dobieramy technologię wellness do Twoich potrzeb.</p>
    <p style="margin-top:10px">
      <a class="text-link" href="formularz-wellness.html" target="_blank" rel="noopener noreferrer">
        Wypełnij formularz doboru<span aria-hidden="true"> →</span>
      </a>
    </p>
  </div>
</li>
```

**Założenie co do struktury katalogów:** `formularz-wellness.html` znajduje się w tym
samym katalogu co `index.html` strony `https://homohumanicus.pl/aplikacja/`. Jeśli
deweloper umieści plik pod inną ścieżką (np. `/aplikacja/formularz/`), trzeba
odpowiednio zaktualizować atrybut `href`.

Link otwiera formularz w nowej karcie (`target="_blank"`), żeby nie tracić kontekstu
strony głównej — to świadoma decyzja, do zmiany jeśli wolicie nawigację w tej samej karcie.

---

## 5. Do wdrożenia przez dewelopera: endpoint wysyłki e-mail

Front-end już wywołuje żądanie do:

```
POST /api/send-consultation-report
Content-Type: application/json
```

**Payload wysyłany przez formularz:**

```json
{
  "to": "januszjankra@gmail.com",
  "imie": "Jan",
  "email": "jan@przyklad.pl",
  "dane": {
    "energia": "Umiarkowany",
    "sen": "Dobra",
    "stres": "Wysoki",
    "obszary": ["koncentracja", "ogólna witalność"],
    "cel_glowny": "relaks i wyciszenie",
    "czestotliwosc": "kilka razy w tygodniu",
    "dla_kogo": "dla siebie",
    "czas": "30-60 min",
    "motywacja": "Chcę lepiej spać.",
    "doswiadczenie": "nie, to pierwszy raz",
    "przeciwwskazania": [],
    "opieka_lekarska": "nie"
  },
  "pdfBase64": "<base64 pliku PDF, bez prefiksu data URI>"
}
```

**Co powinien zrobić endpoint:**
1. Zdekodować `pdfBase64` do pliku binarnego `raport-wellness.pdf`.
2. Wysłać e-mail na adres z pola `to` (docelowo zawsze `januszjankra@gmail.com` —
   warto to i tak zahardkodować po stronie backendu, nie ufać wartości z żądania)
   z załącznikiem PDF, w temacie np. „Nowy raport konsultacyjny — {imie}”.
3. Zwrócić `200 OK` przy sukcesie, kod błędu (np. `500`) przy niepowodzeniu.
4. Zwalidować i zsanityzować pola tekstowe (`imie`, `email`, `motywacja`) przed
   wstawieniem do treści e-maila — to dane od nieuwierzytelnionego użytkownika.

**Sugerowane opcje implementacji** (do wyboru wg dostępnej infrastruktury hostingu):
- PHP + `PHPMailer` lub wbudowane `mail()` z załącznikiem MIME, jeśli hosting
  `homohumanicus.pl` obsługuje PHP.
- Mała funkcja serverless (Vercel/Netlify Functions, Cloudflare Workers) korzystająca
  z API transakcyjnego dostawcy poczty (np. Resend, SendGrid, Postmark) — najprostsze
  we wdrożeniu i utrzymaniu, ale wymaga konta i klucza API u dostawcy.
- Usługa typu Formspree / EmailJS — szybkie wdrożenie, ale sprawdźcie limity
  rozmiaru załącznika (PDF z tego formularza to zwykle < 100 KB, więc powinno się mieścić).

**Bezpieczeństwo:** endpoint powinien mieć podstawowy rate-limiting (np. 1 żądanie /
IP / minutę) i limit rozmiaru payloadu (np. 2 MB), żeby zapobiec nadużyciom.

---

## 6. Zachowanie zapasowe (fallback), dopóki endpoint nie istnieje

Front-end już to obsługuje — deweloper nie musi nic dodawać, żeby formularz był
używalny od zaraz:

1. Użytkownik klika „Wyślij do administratora” z zaznaczoną zgodą.
2. `fetch('/api/send-consultation-report', …)` kończy się błędem (404, bo endpointu
   jeszcze nie ma, lub inny błąd sieci).
3. Formularz automatycznie:
   - pobiera PDF na urządzenie użytkownika,
   - otwiera domyślnego klienta poczty (`mailto:januszjankra@gmail.com`) z gotowym
     tematem i treścią,
   - wyświetla użytkownikowi komunikat, że musi ręcznie załączyć pobrany plik.

To rozwiązanie tymczasowe — po wdrożeniu endpointu z sekcji 5 wysyłka stanie się
w pełni automatyczna i fallback nigdy się nie uruchomi (bo `res.ok` będzie `true`).

---

## 7. Zgodność i zastrzeżenia (nie do pominięcia)

- Formularz i PDF muszą zawsze zawierać zastrzeżenie: urządzenia PEMF/THz to
  technologie wellness wspierające relaks i regenerację, **nie są wyrobem medycznym
  do leczenia chorób**, a formularz nie stawia diagnoz.
- Sekcja przeciwwskazań (rozrusznik serca, ciąża, padaczka, stan ostry, choroba
  nowotworowa w leczeniu) jest częścią bezpieczeństwa użytkownika — nie usuwać ani
  nie ukrywać w wersjach produkcyjnych.
- Zgoda na przesłanie danych do administratora (`#consentSend`) musi pozostać
  **opcjonalna i domyślnie odznaczona** — zgodnie z zasadą dobrowolności zgłoszoną
  przez klienta.
