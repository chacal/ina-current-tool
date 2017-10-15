import INA219 from './INA219'

const PERIODIC_SAMPLER_INTERVAL_MS = 250

export default class PeriodicSampler {
  private io: SocketIO.Namespace
  private ina219: INA219

  constructor(socketIOServer: SocketIO.Server, ina219: INA219) {
    this.io = socketIOServer.of('/periodic-samples')
    this.ina219 = ina219
  }

  start() {
    this.io.on('connection', () => console.log('Periodic client connected'))
    setInterval(() => this.io.emit('periodic-sample', this.ina219.getRawShuntSample()), PERIODIC_SAMPLER_INTERVAL_MS)
  }
}
