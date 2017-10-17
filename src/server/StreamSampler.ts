import Timer = NodeJS.Timer
import I2CCurrentMonitor from './I2CCurrentMonitor'

const SAMPLE_EMIT_INTERVAL_MS = 10

export default class StreamSampler {
  private io: SocketIO.Namespace
  private monitor: I2CCurrentMonitor
  private sampleEmitTimer: Timer
  private sampleBuffer: Sample[] = []


  constructor(socketIOServer: SocketIO.Server, monitor: I2CCurrentMonitor) {
    this.io = socketIOServer.of('/sample-stream')
    this.monitor = monitor

    this.io.on('connection', (client: SocketIO.Socket) => {
      console.log('Stream client connected')
      client.emit('sampling-state', this.samplingState())
    })

    this.monitor.on('sample', sample => {
      const [seconds, nanos] = process.hrtime()
      this.sampleBuffer.push({hrtime: {seconds, nanos}, value: sample})
    })
  }

  startSampling(interval: number) {
    this.monitor.startSampling(interval)
    this.sampleEmitTimer = setInterval(() => this.emitBufferedSamples(), SAMPLE_EMIT_INTERVAL_MS)
    this.io.emit('sampling-state', this.samplingState())
  }

  stopSampling() {
    this.monitor.stopSampling()
    clearInterval(this.sampleEmitTimer)
    this.io.emit('sampling-state', this.samplingState())
  }


  private emitBufferedSamples() {
    if(this.sampleBuffer.length > 0) {
      this.io.emit('samples', this.sampleBuffer)
      this.sampleBuffer = []
    }
  }

  private samplingState = () => ({sampling: this.monitor.isSampling, resistorValue: this.monitor.resistorValue, calibration: this.monitor.calibration})
}
