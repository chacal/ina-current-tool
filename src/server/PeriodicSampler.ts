import I2CCurrentMonitor from './I2CCurrentMonitor'

const PERIODIC_SAMPLER_INTERVAL_MS = 250

export default class PeriodicSampler {
  private io: SocketIO.Namespace
  private monitor: I2CCurrentMonitor

  constructor(socketIOServer: SocketIO.Server, monitor: I2CCurrentMonitor) {
    this.io = socketIOServer.of('/periodic-samples')
    this.monitor = monitor
  }

  start() {
    this.io.on('connection', () => console.log('Periodic client connected'))
    setInterval(() => this.io.emit('periodic-sample', this.monitor.getShuntCurrent()), PERIODIC_SAMPLER_INTERVAL_MS)
  }
}
