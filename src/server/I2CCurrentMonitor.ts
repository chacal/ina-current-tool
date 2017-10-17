import i2c = require('i2c-bus')
import {EventEmitter} from 'events'

const DEFAULT_RESISTOR_VALUE = 0.1     // Use 0.1Ω resistor as default

export default abstract class I2CCurrentMonitor extends EventEmitter {
  isSampling: boolean
  resistorValue: number
  calibration: number
  protected i2cBus: any
  protected i2cAddress: number

  constructor(i2cBusNumber: number, i2cAddress: number) {
    super()
    this.i2cBus = i2c.openSync(i2cBusNumber)
    this.i2cAddress = i2cAddress
    this.isSampling = false
    this.resistorValue = DEFAULT_RESISTOR_VALUE
    this.calibration = 0
  }

  startSampling(interval: number = 0) {
    if(this.isSampling) {
      return
    }

    this.isSampling = true
    this.configureForInterval(interval)
    const self = this

    console.log(`Sampling with ${interval}ms interval`)
    emitSample()

    function emitSample() {
      if(! self.isSampling) {
        return
      }

      self.emit('sample', self.getShuntCurrent())
      if(interval > 0) {
        setTimeout(emitSample, interval)
      } else {
        setImmediate(emitSample)
      }
    }
  }

  stopSampling() {
    this.isSampling = false
    console.log(`Stopped sampling`)
  }

  calibrate(resistorValue: number, calibration: number) {
    if(resistorValue !== undefined) {
      this.resistorValue = resistorValue
    }
    if(calibration !== undefined) {
      this.calibration = calibration
    }
  }

  abstract getShuntCurrent(): number
  protected abstract configureForInterval(interval: number): void

  // Swaps lowest two bytes (e.g. 0x11ff -> 0xff11)
  protected toMSB(word: number) {
    return ((word & 0xFF) << 8) + ((word >> 8) & 0xFF)
  }

  protected twosComplementToInt(val: number) {
    if(val >> 15 === 1) {
      return -(~val & 0xff) - 1
    } else {
      return val
    }
  }
}
