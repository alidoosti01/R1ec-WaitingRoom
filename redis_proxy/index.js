// redis http proxy
const express = require('express')
const Redis = require('ioredis')
const app = express()
const redis = new Redis({
  host: 'redis-server-ip',
  port: 6379
})

app.use(express.json())

app.get('/dbsize', async (req, res) => {
  try {
    const size = await redis.dbsize()
    res.json({ result: size })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/get/:key', async (req, res) => {
  try {
    const value = await redis.get(req.params.key)
    res.json({ result: value })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/setex/:key/:seconds/:value', async (req, res) => {
  try {
    await redis.setex(req.params.key, parseInt(req.params.seconds), req.params.value)
    res.json({ result: 'OK' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(3000, () => {
  console.log('Redis HTTP Proxy running on port 3000')
})
