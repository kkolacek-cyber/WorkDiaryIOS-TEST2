# Kako ovo dobiti na iPhone 17 — s Windowsa, bez plaćanja

Cilj: `.ipa` datoteka koju Sideloadly potpiše tvojim **besplatnim** Apple ID-em i
instalira na telefon. Tri koraka.

---

## Korak 1 — Pokreni projekt lokalno (Windows)

```bash
npm install
npx expo install --fix     # poravna verzije paketa s tvojim Expo SDK-om
npx expo start
```

Skini **Expo Go** na iPhone i skeniraj QR kod — vidjet ćeš aplikaciju odmah, na
telefonu, i mijenjati kod uživo. Ovo je za razvoj i dizajn.

> Notifikacije i CSV export u Expo Go znaju biti ograničeni — sve ostalo radi.
> Puna funkcionalnost dolazi s pravim buildom u Koraku 2.

---

## Korak 2 — Napravi `.ipa` (besplatno, bez Maca)

Apple dopušta gradnju iOS aplikacija **samo na macOS-u**. Ali ne moraš imati Mac —
GitHub ti ga posudi besplatno.

1. Napravi repo na GitHubu i pushaj ovaj projekt.
   **Postavi ga na Public** → macOS minute su tad neograničene i besplatne.
   (Ako je Private: 2000 min/mj ÷ 10x multiplikator = ~200 min = ~8 buildova.)
2. Na GitHubu idi na **Actions → "Build unsigned iOS IPA" → Run workflow**.
3. Čekaj ~15–25 min.
4. Skini artifact **RadniDnevnik-unsigned-ipa** → unutra je `.ipa`.

Workflow je već napisan i nalazi se u `.github/workflows/build-ios-unsigned.yml`.
Gradi aplikaciju **bez potpisa** — potpisivanje radi Sideloadly u sljedećem koraku
tvojim Apple ID-em.

### Ako workflow zapne

Prebuild i xcodebuild znaju biti izbirljivi. Otvori log u Actionsu, pošalji mi
grešku i popravimo. Rezervna opcija: bilo koji Mac na sat vremena
(`npx expo run:ios --device`) daje isti rezultat.

---

## Korak 3 — Potpiši i instaliraj (Windows)

1. Instaliraj **iTunes** — obavezno verzija s Appleove stranice, **ne** ona iz
   Microsoft Storea. Sideloadly bez nje ne vidi telefon.
2. Skini **Sideloadly** s https://sideloadly.io
3. Spoji iPhone USB kabelom, "Trust This Computer".
4. Povuci `.ipa` u Sideloadly, upiši svoj Apple ID, klikni **Start**.
5. Na iPhoneu: **Postavke → Općenito → VPN i upravljanje uređajem** → povjeri
   svoj certifikat.

Gotovo — ikona je na home screenu.

---

## Što s besplatnim Apple ID-em moraš znati

| | Besplatni Apple ID | Developer Program ($99/god) |
|---|---|---|
| Trajanje | **7 dana**, pa treba refresh | 1 godina |
| Broj sideloadanih appova | 3 | 100+ |
| Treba li PC za refresh | Da (ili Wi-Fi auto-refresh) | Ne |

**Refresh svakih 7 dana:** Sideloadly ima auto-refresh preko Wi-Fija — dok su PC i
iPhone na istoj mreži, sam produžuje. Ako propustiš rok, app se samo prestane
otvarati; **podaci ostaju** i vrate se čim ponovno potpišeš. Ništa se ne gubi.

Ako te 7-dnevni ciklus počne živcirati, $99/god je jedini način da ga se riješiš.

---

## Ažuriranje aplikacije poslije

Promijeniš kod → push na GitHub → Run workflow → skini novi `.ipa` → Sideloadly
preko starog. Podaci u bazi ostaju netaknuti (isti bundle ID).
