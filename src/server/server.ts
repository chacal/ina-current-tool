import INA219 from './INA219'
import StreamSampler from './StreamSampler'
import PeriodicSampler from './PeriodicSampler'
import bodyParser = require('body-parser')
import {Request, Response} from 'express'

const express = require('express')
const path = require('path')

const PORT = process.env.PORT || 3001
const app = express()
const server = require('http').createServer(app)
const socketIOServer = require('socket.io')(server)

const ina219 = new INA219()
const streamSampler = new StreamSampler(socketIOServer, ina219)
const periodicSampler = new PeriodicSampler(socketIOServer, ina219)


server.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
periodicSampler.start()


app.use(express.static(path.resolve(__dirname, '..', '..')))
app.use(bodyParser.json())

app.post('/start-sampling', (req: Request, res: Response) => {
  streamSampler.startSampling(req.body.interval || 0)
  res.status(204).end()
})

app.post('/stop-sampling', (req: Request, res: Response) => {
  streamSampler.stopSampling()
  res.status(204).end()
})

app.post('/calibrate', (req: Request, res: Response) => {
  ina219.calibrate(req.body.resistor, req.body.calibration)
  res.status(204).end()
})
