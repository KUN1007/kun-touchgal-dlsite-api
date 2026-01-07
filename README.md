# kun-touchgal-dlsite-api

DLsite metadata API for [TouchGal](https://github.com/KUN1007/kun-touchgal-next).

## Development

```bash
pnpm install
pnpm dev
```

The dev server listens on `http://localhost:8787`. Available routes:

| Method | Path            | Description                               |
| ------ | --------------- | ----------------------------------------- |
| GET    | `/health`       | Returns `{ status: "ok" }`.               |
| GET    | `/api/dlsite`   | Requires `code` query (RJ/VJ). Returns a `DlsiteApiResponse` on success. |

## Production build

```bash
pnpm build
node dist/index.js
```

## Testing

```bash
pnpm test
```
