# Private hosting (iPad / anywhere, not public)

This game uses a **client-side PIN gate** on any non-localhost URL. That stops casual visitors but is **not** a substitute for private hosting — always deploy to a **private** channel and change the default PIN in `js/access-config.js`.

## Recommended: Private GitHub repo + GitHub Pages

1. Create a **private** repository (GitHub → New repository → Private).
2. Push this project:
   ```bash
   git remote add origin git@github.com:YOUR_USER/ukulele-rhythm-monster-rpg.git
   git push -u origin main
   ```
3. **Settings → Pages → Build and deployment**: Source = Deploy from branch, branch = `main`, folder = `/ (root)`.
4. Only **collaborators** on the private repo can open the Pages URL. Share the URL and PIN only with your students.
5. Change `pin` in `js/access-config.js` before the first deploy, then push again.

Pages URL shape: `https://YOUR_USER.github.io/ukulele-rhythm-monster-rpg/`

## Alternative: Cloudflare Tunnel (no public repo)

Good when you want HTTPS on iPad without publishing to GitHub Pages.

1. Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
2. From the game folder, serve locally:
   ```bash
   python3 run.py
   ```
3. In another terminal:
   ```bash
   cloudflared tunnel --url http://127.0.0.1:8765
   ```
4. Cloudflare prints a **random `*.trycloudflare.com` URL**. Share that URL + PIN only with trusted people. The tunnel stops when you close the terminal.

For a stable hostname, use a named Cloudflare Tunnel with **Cloudflare Access** (email OTP or one-time PIN) in front of the app.

## Local dev (no PIN)

- Double-click `index.command` → opens `http://127.0.0.1:8765/` (PIN bypass).
- Opening `index.html` via `file://` also bypasses the gate.

## Security notes

- Default PIN is `1234` — change it before sharing any URL.
- PIN is checked in the browser; determined users can bypass it. Private repo access + PIN is the intended model for classroom use.
- **Do not** enable public GitHub Pages on a public repo without changing the PIN and accepting that the URL is discoverable.
