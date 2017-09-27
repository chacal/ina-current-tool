import INA219 from './INA219'
import bodyParser = require('body-parser')
import {Request, Response} from 'express'
import Timer = NodeJS.Timer
import Socket = SocketIO.Socket

const express = require('express')
const path = require('path')

const PORT = process.env.PORT || 3001
const SAMPLE_EMIT_INTERVAL_MS = 5

const app = express()
const server = require('http').createServer(app)
const socketIOServer = require('socket.io')(server)
const ina219 = new INA219()
let sampleEmitTimer: Timer
let sampleBuffer: Sample[] = []


server.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
ina219.on('sample', sample => sampleBuffer.push({ts: new Date().getTime(), value: sample}))


app.use(express.static(path.resolve(__dirname, '..', '..')))
app.use(bodyParser.json())


socketIOServer.on('connection', (client: Socket) => {
  console.log('Client connected')
  client.emit('sampling-state', samplingState())
})


app.post('/start-sampling', (req: Request, res: Response) => {
  ina219.startSampling(req.body.interval || 0)
  sampleEmitTimer = setInterval(emitBufferedSamples, SAMPLE_EMIT_INTERVAL_MS)
  socketIOServer.emit('sampling-state', samplingState())
  res.status(204).end()
})

app.post('/stop-sampling', (req: Request, res: Response) => {
  ina219.stopSampling()
  clearInterval(sampleEmitTimer)
  socketIOServer.emit('sampling-state', samplingState())
  res.status(204).end()
})


function emitBufferedSamples() {
  if(sampleBuffer.length > 0) {
    socketIOServer.emit('samples', sampleBuffer)
    sampleBuffer = []
  }
}

function samplingState() {
  return {sampling: ina219.isSampling}
}

