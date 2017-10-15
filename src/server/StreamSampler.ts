import INA219 from './INA219'
import Timer = NodeJS.Timer

const SAMPLE_EMIT_INTERVAL_MS = 10

export default class StreamSampler {
  private io: SocketIO.Namespace
  private ina219: INA219
  private sampleEmitTimer: Timer
  private sampleBuffer: Sample[] = []


  constructor(socketIOServer: SocketIO.Server, ina219: INA219) {
    this.io = socketIOServer.of('/sample-stream')
    this.ina219 = ina219

    this.io.on('connection', (client: SocketIO.Socket) => {
      console.log('Stream client connected')
      client.emit('sampling-state', this.samplingState())
    })

    this.ina219.on('sample', sample => {
      const [seconds, nanos] = process.hrtime()
      this.sampleBuffer.push({hrtime: {seconds, nanos}, value: sample})
    })
  }

  startSampling(interval: number) {
    this.ina219.startSampling(interval)
    this.sampleEmitTimer = setInterval(() => this.emitBufferedSamples(), SAMPLE_EMIT_INTERVAL_MS)
    this.io.emit('sampling-state', this.samplingState())
  }

  stopSampling() {
    this.ina219.stopSampling()
    clearInterval(this.sampleEmitTimer)
    this.io.emit('sampling-state', this.samplingState())
  }


  private emitBufferedSamples() {
    if(this.sampleBuffer.length > 0) {
      this.io.emit('samples', this.sampleBuffer)
      this.sampleBuffer = []
    }
  }

  private samplingState = () => ({sampling: this.ina219.isSampling})
}
