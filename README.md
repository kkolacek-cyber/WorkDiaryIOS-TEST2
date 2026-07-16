# Radni Dnevnik — iOS (narančasta verzija) 🟠

Port Android/Kotlin aplikacije na **React Native + Expo**, s narančastim
gradijentom umjesto plavog. Sve lokalno, bez interneta, bez servera.

**Za instalaciju na iPhone vidi [UPUTE-INSTALACIJA.md](./UPUTE-INSTALACIJA.md).**

---

## Stack i što je čime zamijenjeno

| Android (Kotlin) | iOS (Expo) |
|---|---|
| Room | `expo-sqlite` (isti SQL, ista shema) |
| Jetpack Compose | React Native + expo-router |
| WorkManager | `expo-notifications`, zakazane unaprijed |
| Compose gradijent (lažni glass) | `expo-blur` — **pravi** nativni blur |
| FileProvider + share sheet | `expo-file-system` + `expo-sharing` |
| DataStore | AsyncStorage |

## Struktura

```
app/
  _layout.tsx           SQLiteProvider, migracije, tap-na-notifikaciju
  (tabs)/
    index.tsx           Home — zadnjih 7 dana, sažetak, FAB
    kalendar.tsx        Mjesečni grid, filter, statistika, graf
    postavke.tsx        Satnica, sat podsjetnika, toggleovi, CSV
  dan/[date].tsx        Unos/izmjena jednog dana
src/
  db/database.ts        Shema + migracije (PRAGMA user_version)
  db/entries.ts         CRUD + getFilledRange + agregacije
  notifications.ts      Zakazivanje podsjetnika
  csv.ts                Export s BOM-om za Excel
  theme.ts              Narančasta paleta
  components/           GlassCard, StatusBadge, WorkTypeChip, MiniBarChart
```

`getFilledRange()` radi isto što i na Androidu: puni "rupe" u rasponu datuma
praznim zapisima u memoriji, pa je **svaki dan uvijek vidljiv**, a u bazu se
piše tek kad nešto upišeš.

---

## Novo u odnosu na Android verziju

- **Pravi glass.** `expo-blur` na iOS-u je nativni materijal — ono što je na
  Androidu bila simulacija poluprozirnim gradijentom, ovdje stvarno zamućuje
  narančastu pozadinu iza kartice.
- **Notifikacije bez pozadinskog posla.** iOS ne dopušta pouzdano periodično
  buđenje, pa se podsjetnici **zakazuju unaprijed na točan datum i sat**, a
  raspored se ponovno izgradi nakon svake promjene. Rezultat je točniji i ne
  troši bateriju uopće. (iOS limit je 64 zakazane notifikacije — kod to poštuje.)
- **"Duguju ti" umjesto broja dana.** Home sad pokazuje ukupan neplaćeni iznos
  u eurima preko *svih* zapisa, ne samo zadnjih 7 dana. To je broj koji te
  zapravo zanima.
- **Brzo označavanje isplate.** Na kartici koja čeka isplatu ima gumb
  "Označi kao isplaćeno" — ili dugi pritisak na karticu. Najčešća radnja, sad
  bez otvaranja ekrana.
- **Graf zarade zadnjih 6 mjeseci** na dnu Kalendara (bez ijedne biblioteke).
- **Ukupno sati** u mjesečnoj statistici.
- **Haptika** na svakoj interakciji — na iPhoneu to je razlika između
  "portana Android aplikacija" i "iOS aplikacija".
- **Pull-to-refresh** na Home ekranu.

## Zadržano 1:1

Zadnjih 7 dana s uvijek vidljivim praznim danima · kalendar sa zelenim/žutim
točkicama · filter "samo neplaćeno" · tip posla Uslužno/Obiteljski · opis ·
sati · zarada · **dvosmjerni auto-izračun sati ⇄ zarada preko satnice** ·
isplaćeno + datum isplate s pickerom · spremi/obriši · CSV export · podsjetnik
za neplaćeno starije od 7 dana · podsjetnik za neupisani dan · tap na
notifikaciju otvara taj dan.

---

## Napomene

- **Verzije paketa** u `package.json` su namjerno `*`. Pokreni
  `npx expo install --fix` — Expo će sam postaviti verzije koje odgovaraju
  tvom SDK-u. Tako ne puca kad izađe novi SDK.
- **Ista baza, ista shema** kao Android verzija, pa CSV s Androida ide ravno u
  Excel s ovim zajedno.
- Aplikacija radi i na Androidu (`npx expo start` → Android) ako ti ikad zatreba
  jedna verzija za oba telefona.
