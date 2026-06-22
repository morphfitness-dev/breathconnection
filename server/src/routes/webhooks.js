import express from 'express'
import Mux from '@mux/mux-node'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

export const webhookRouter = express.Router()

webhookRouter.post(
  '/api/webhooks/mux',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const rawBody = req.body
    const signature = req.headers['mux-signature']

    try {
      Mux.Webhooks.verifyHeader(rawBody, signature, process.env.MUX_WEBHOOK_SECRET)
    } catch (err) {
      console.error('Mux webhook signature verification failed:', err.message)
      return res.status(400).json({ error: 'Invalid signature.' })
    }

    let event
    try {
      event = JSON.parse(rawBody.toString())
    } catch {
      return res.status(400).json({ error: 'Invalid JSON.' })
    }

    if (event.type === 'video.asset.ready') {
      const assetId = event.data.id
      const uploadId = event.data.upload_id
      const playbackId = event.data.playback_ids?.[0]?.id

      if (playbackId) {
        const { data: updated } = await supabaseAdmin
          .from('programme_sessions')
          .update({
            mux_playback_id: playbackId,
            mux_asset_id: assetId,
            video_uploaded_at: new Date().toISOString(),
          })
          .eq('mux_asset_id', assetId)
          .select('id')

        if (!updated || updated.length === 0) {
          // Try matching upload_id (stored initially before asset ID was known)
          await supabaseAdmin
            .from('programme_sessions')
            .update({
              mux_playback_id: playbackId,
              mux_asset_id: assetId,
              video_uploaded_at: new Date().toISOString(),
            })
            .eq('mux_asset_id', uploadId)
        }
      }
    } else if (event.type === 'video.upload.cancelled' || event.type === 'video.asset.errored') {
      console.error('Mux error event:', event.type, event.data)
      const uploadId = event.data.upload_id || event.data.id
      if (uploadId) {
        await supabaseAdmin
          .from('programme_sessions')
          .update({ mux_asset_id: null })
          .eq('mux_asset_id', uploadId)
      }
    }

    res.status(200).json({ received: true })
  }
)
