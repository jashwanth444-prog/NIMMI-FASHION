# Running the NIMMI FASHIONS preview

The site is a **static** page — `index.html`, `styles.css`, `script.js` plus the
image/video asset folders. There is no build step, no package manager, and no
dependencies to install.

## 1. Reproduce the artifacts

Nothing to compile or generate. The only derived assets are the campaign film
posters, which exist so the editorial carousel shows a frame before playback
starts (they are not part of the original upload):

```bash
mkdir -p "Editorial Videos/posters"
for i in 1 2 3; do
  ffmpeg -hide_banner -loglevel error -y -ss 0.4 -i "Editorial Videos/video $i.mp4" \
    -frames:v 1 -vf "scale=720:-2" -q:v 5 "Editorial Videos/posters/film-$i.jpg"
done
```

The uploaded assets themselves (`Hero video/`, `row 1`–`row 5`,
`Editorial Videos/*.mp4`, `Editorial Products/`, `logo.png`) are the source of
truth and must not be regenerated or replaced.

## 2. Run the server

From the project root:

```bash
{ nohup python3 -m http.server 8779 --bind 127.0.0.1 > ".freebuff/preview.log" 2>&1 < /dev/null & echo "pid=$!"; disown; }
```

Then confirm it survived and answers before registering the preview:

```bash
sleep 5; PID=$(pgrep -f "http.server 8779" | head -1); kill -0 "$PID" && echo alive
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8779/index.html
```

- **Port:** 8779 (loopback only). Use another free port if it is taken, and
  adapt the URL when registering the preview.
- **Log:** `.freebuff/preview.log` (the app may pass a different log path —
  use that one when it does).
- Do **not** use `launchctl submit` here: macOS refuses to exec a job whose
  working directory is under `~/Desktop` (fails with `EX_CONFIG`).
