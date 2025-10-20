import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { extractAudio } from '../../../lib/ffmpeg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function cleanupTemp(tmpDir: string) {
  try {
    await fs.rm(tmpDir, { recursive: true, force: true })
  } catch {}
}

async function getFileBuffer(req: Request): Promise<{ buffer: Buffer; filename: string }> {
  const url = new URL(req.url)
  const ct = req.headers.get('content-type') || ''

  let filename = url.searchParams.get('filename') || 'upload.bin'
  let buffer: Buffer

  // Handle multipart form data
  if (ct.includes('multipart/form-data')) {
    const form = await req.formData()
    const file = form.get('file') as File | null

    if (!file) {
      throw new Error('Missing file in form data')
    }

    filename = file.name || filename
    buffer = Buffer.from(await file.arrayBuffer())
  } else {
    // Handle raw body upload
    const blob = await req.blob()
    buffer = Buffer.from(await blob.arrayBuffer())
  }

  return { buffer, filename }
}

export async function POST(req: Request) {
  let tmpDir: string | null = null

  try {
    // Parse request and get file data
    const { buffer, filename } = await getFileBuffer(req)

    // Validate file
    if (buffer.length === 0) {
      return new Response('Empty file', { status: 400 })
    }

    // Create temp directory for processing
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'extract-'))
    const inputPath = path.join(tmpDir, filename)
    await fs.writeFile(inputPath, buffer)

    // Prepare output path
    const outputsDir = path.join(process.cwd(), 'outputs')
    await fs.mkdir(outputsDir, { recursive: true })

    const base = path.basename(filename).replace(/\.[^.]+$/, '')
    const id = crypto.randomBytes(6).toString('hex')
    const outputName = `${base}-${id}.m4a`
    const outputPath = path.join(outputsDir, outputName)

    // Extract audio using ffmpeg (always m4a)
    await extractAudio(inputPath, outputPath)

    // Read output file
    const audioData = await fs.readFile(outputPath)

    // Cleanup temp directory (including input file)
    await cleanupTemp(tmpDir)
    tmpDir = null

    // Return audio file with proper Unicode filename handling
    return new Response(new Uint8Array(audioData), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Disposition': `attachment; filename="audio.m4a"; filename*=UTF-8''${encodeURIComponent(base)}.m4a`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    // Clean up temp directory on error
    if (tmpDir) {
      await cleanupTemp(tmpDir)
    }

    const errorMessage = e?.message || 'Failed to extract audio'
    return new Response(errorMessage, { status: 500 })
  }
}
