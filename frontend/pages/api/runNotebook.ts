// pages/api/runNotebook.ts
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  job_id?: string
  status?: string
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  try {
    const runnerUrl = process.env.NOTEBOOK_RUNNER_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    const r = await fetch(`${runnerUrl}/run-notebook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    })
    const data = await r.json()
    return res.status(r.status).json(data)
  } catch (err: any) {
    console.error('runNotebook proxy error:', err)
    return res.status(500).json({ error: String(err) })
  }
}
