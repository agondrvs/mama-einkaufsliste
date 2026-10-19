# Einkaufsliste 🧺

Eine ganz einfache, schöne Einkaufsliste – fürs Handy gemacht.

- **Aufschreiben:** unten eintippen und auf ➕ drücken
- **Abhaken:** auf den Artikel tippen – er wandert nach „Im Korb“
- **Aufräumen:** entfernt alles, was schon im Korb ist (mit „Rückgängig“)
- **Oft gekauft:** Vorschläge über dem Eingabefeld, ein Tipp genügt
- Funktioniert offline, speichert alles direkt auf dem Gerät, hat einen hellen und einen dunklen Modus

Keine Anmeldung, kein Server, keine Abhängigkeiten – nur HTML, CSS und JavaScript.

## Online stellen (GitHub Pages)

1. Im Repository auf **Settings → Pages** gehen
2. Bei *Source* „Deploy from a branch“ wählen, Branch `main` und Ordner `/ (root)`
3. Nach ca. einer Minute ist die App unter `https://<benutzername>.github.io/mama-einkaufsliste/` erreichbar

## Auf dem Handy installieren

- **iPhone (Safari):** Seite öffnen → Teilen-Symbol → „Zum Home-Bildschirm“
- **Android (Chrome):** Seite öffnen → Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“

Danach startet die App wie eine normale App, ganz ohne Browserleiste.

## Lokal ausprobieren

```sh
python3 -m http.server 8000
```

Dann <http://localhost:8000> öffnen.
