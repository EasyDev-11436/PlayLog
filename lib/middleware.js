// lib/middleware.js
import { auth } from './firebase-admin'

export function withAuth(handler) {
  return async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    try {
      const decodedToken = await auth.verifyIdToken(token)
      req.user = decodedToken // Attach user info to the request
      return handler(req, res)
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }
}