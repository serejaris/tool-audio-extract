import { spawn } from 'child_process'

export function checkFfmpeg(): Promise<{ ok: boolean; version?: string; error?: string }> {
  return new Promise((resolve) => {
    const p = spawn('ffmpeg', ['-version'])
    let out = ''
    let err = ''
    p.stdout.on('data', (d) => (out += d.toString()))
    p.stderr.on('data', (d) => (err += d.toString()))
    p.on('error', (e) => {
      const errorMsg = e.message.includes('ENOENT')
        ? 'ffmpeg is not installed or not in PATH'
        : e.message
      resolve({ ok: false, error: errorMsg })
    })
    p.on('close', (code) => {
      if (code === 0) resolve({ ok: true, version: out.split('\n')[0] })
      else resolve({ ok: false, error: err || `ffmpeg exited with code ${code}` })
    })
  })
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args)
    let stderr = ''
    p.stderr.on('data', (d) => (stderr += d.toString()))
    p.on('error', (e) => {
      const errorMsg = e.message.includes('ENOENT')
        ? 'ffmpeg is not installed or not in PATH'
        : e.message
      reject(new Error(errorMsg))
    })
    p.on('close', (code) => {
      if (code === 0) resolve()
      else {
        const errorMsg = stderr.trim() || `${cmd} exited with code ${code}`
        reject(new Error(errorMsg))
      }
    })
  })
}

export async function extractAudio(inputPath: string, outputPath: string): Promise<void> {
  const common = ['-hide_banner', '-y', '-i', inputPath, '-vn', '-sn', '-dn']

  try {
    // Try stream copy first (fastest, no re-encoding)
    await run('ffmpeg', [...common, '-c:a', 'copy', outputPath])
  } catch {
    // Fallback to AAC re-encode if copy fails
    await run('ffmpeg', [...common, '-c:a', 'aac', '-b:a', '192k', outputPath])
  }
}

