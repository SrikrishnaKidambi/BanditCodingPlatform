module.exports = function internalAuth(req, res, next) {
  const token = req.headers['x-internal-token']
  const expected = process.env.INTERNAL_API_TOKEN
  if (!expected) {
    return next()
  }
  if (!token || token !== expected)
    return res.status(401).json({ error: 'Unauthorized' })
  next()
}
