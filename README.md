<!-- hq-readme-ru: 2026-05-09 -->
# tool-audio-extract

Коротко: Инструмент для транскрибации или обработки аудио/видео.

## Что здесь

- Назначение: Инструмент для транскрибации или обработки аудио/видео.
- Основной стек: TypeScript.
- Видимость: публичный репозиторий.
- Статус: активный репозиторий; актуальность проверять по issues и последним коммитам.

## Где смотреть работу

- Задачи и текущие решения: GitHub Issues этого репозитория.
- Код и материалы: файлы в корне и профильные папки проекта.
- Связь с HQ: если проект влияет на продукт, контент или воронку, сверяйте канон в `0_hq` и репозитории-владельце.

## Для агентов

- Сначала прочитайте этот README и открытые issues.
- Не переносите сюда канон соседних проектов без ссылки на источник.
- Перед правками проверьте существующие scripts, package.json/pyproject и локальные инструкции.

---

## Исходный README

# Audio Extractor (Next.js + ffmpeg)

Single-user MVP web tool to extract audio from uploaded video using ffmpeg.

## Features
- Upload video, download audio as `m4a` (default), `mp3`, or `wav`.
- Uses `ffmpeg` via Node `child_process`.
- Saves a copy in `outputs/` and returns the file for download.
- Optional Basic Auth with env vars.
- Health check at `/api/ffmpeg`.

## Prerequisites
- Node 18+ (Next.js 15 ready)
- ffmpeg installed and available in PATH
  - macOS (Homebrew): `brew install ffmpeg`
  - Linux (Debian/Ubuntu): `sudo apt-get install ffmpeg`

## Setup
```
cd audio-extractor-next
npm install
# Optional: protect with basic auth
# echo "BASIC_AUTH_USER=me" >> .env.local
# echo "BASIC_AUTH_PASS=secret" >> .env.local
npm run dev
```
Then open http://localhost:3000

## Usage
- Choose a video file and output format.
- Click "Extract audio" — the browser downloads the result.
- A copy is also saved to `outputs/` inside the project.

## Notes
- `m4a` tries stream copy (`-c:a copy`) first; if it fails, it re-encodes to AAC 192k.
- `mp3` uses `libmp3lame` at 192k.
- `wav` uses `pcm_s16le`.

## Health Check
- Visit `/api/ffmpeg` to verify ffmpeg availability.

## Security
- For single-user local use. Enable Basic Auth via `.env.local` if needed.

## License
- Internal MVP for personal use.

