import I2CCurrentMonitor from './I2CCurrentMonitor'

const SHUNT_LSB_UV           = 2.5     // INA226 has 2.5µV LSB step size

export enum Registers {
  CONFIG = 0x00,
  SHUNT_VOLTAGE = 0x01,
  BUS_VOLTAGE = 0x02,
  POWER = 0x03,
  CURRENT = 0x04,
  CALIBRATION = 0x05,
  MASK_ENABLE = 0x06,
  ALERT_LIMIT = 0x07,
  MANUFACTURER_ID = 0xFE,
  DIE_ID = 0xFF
}

export enum AveragingMode {
  AVERAGING_NUM_SAMPLES_1        = 0x0000,
  AVERAGING_NUM_SAMPLES_4        = 0x0200,
  AVERAGING_NUM_SAMPLES_16       = 0x0400,
  AVERAGING_NUM_SAMPLES_64       = 0x0600,
  AVERAGING_NUM_SAMPLES_128      = 0x0800,
  AVERAGING_NUM_SAMPLES_256      = 0x0A00,
  AVERAGING_NUM_SAMPLES_512      = 0x0C00,
  AVERAGING_NUM_SAMPLES_1024     = 0x0E00,
}

export enum BusConversionTime {
  BUS_CONVERSION_TIME_140_US      = 0x0000,
  BUS_CONVERSION_TIME_204_US      = 0x0040,
  BUS_CONVERSION_TIME_332_US      = 0x0080,
  BUS_CONVERSION_TIME_588_US      = 0x00C0,
  BUS_CONVERSION_TIME_1100_US     = 0x0100,
  BUS_CONVERSION_TIME_2116_US     = 0x0140,
  BUS_CONVERSION_TIME_4156_US     = 0x0180,
  BUS_CONVERSION_TIME_8244_US     = 0x01C0
}

export enum ShuntConversionTime {
  SHUNT_CONVERSION_TIME_140_US      = 0x0000,
  SHUNT_CONVERSION_TIME_204_US      = 0x0080,
  SHUNT_CONVERSION_TIME_332_US      = 0x0100,
  SHUNT_CONVERSION_TIME_588_US      = 0x0180,
  SHUNT_CONVERSION_TIME_1100_US     = 0x0200,
  SHUNT_CONVERSION_TIME_2116_US     = 0x0280,
  SHUNT_CONVERSION_TIME_4156_US     = 0x0300,
  SHUNT_CONVERSION_TIME_8244_US     = 0x0380
}

export enum OperationMode {
  POWERDOWN 			            = 0x0000,
  SHUNT_TRIGGERED 	 	        = 0x0001,
  BUS_TRIGGERED 	 	          = 0x0002,
  SHUNT_AND_BUS_TRIGGERED 	  = 0x0003,
  ADCOFF 			 	              = 0x0004,
  SHUNT_CONTINUOUS 	          = 0x0005,
  BUS_CONTINUOUS 	            = 0x0006,
  SHUNT_AND_BUS_CONTINUOUS	  = 0x0007
}

export default class INA226 extends I2CCurrentMonitor {

  constructor(i2cBusNumber: number = 1, i2cAddress: number = 0x40) {
    super(i2cBusNumber, i2cAddress)
  }

  configure(busConversionTime: BusConversionTime, shuntConversionTime: ShuntConversionTime, avgMode: AveragingMode, operationMode: OperationMode): void {
    this.i2cBus.writeWordSync(this.i2cAddress, Registers.CONFIG, this.toMSB(busConversionTime + shuntConversionTime + avgMode + operationMode))
  }

  getShuntCurrent(): number {
    const rawValue = this.twosComplementToInt(this.toMSB(this.i2cBus.readWordSync(this.i2cAddress, Registers.SHUNT_VOLTAGE)))
    return ((rawValue + this.calibration) * SHUNT_LSB_UV / this.resistorValue) / 1000 / 1000
  }

  calibrate(resistorValue: number, calibration: number) {
    if(resistorValue !== undefined) {
      this.resistorValue = resistorValue
    }
    if(calibration !== undefined) {
      this.calibration = calibration
    }
  }

  protected configureForInterval(sampleIntervalMs: number) {
    const {shunt, avgMode} = adcSettingsForSampleInterval(sampleIntervalMs)
    this.configure(BusConversionTime.BUS_CONVERSION_TIME_140_US, shunt, avgMode, OperationMode.SHUNT_CONTINUOUS)
    console.log(`INA226 ADC set to ${ShuntConversionTime[shunt]} with ${AveragingMode[avgMode]}`)

    function adcSettingsForSampleInterval(interval: number) {
      if(interval <= 1) {
        return {shunt: ShuntConversionTime.SHUNT_CONVERSION_TIME_588_US, avgMode: AveragingMode.AVERAGING_NUM_SAMPLES_1}
      } else if(interval <= 2) {
        return {shunt: ShuntConversionTime.SHUNT_CONVERSION_TIME_1100_US, avgMode: AveragingMode.AVERAGING_NUM_SAMPLES_1}
      } else if(interval <= 4) {
        return {shunt: ShuntConversionTime.SHUNT_CONVERSION_TIME_2116_US, avgMode: AveragingMode.AVERAGING_NUM_SAMPLES_1}
      } else if(interval <= 8) {
        return {shunt: ShuntConversionTime.SHUNT_CONVERSION_TIME_4156_US, avgMode: AveragingMode.AVERAGING_NUM_SAMPLES_1}
      } else if(interval <= 16) {
        return {shunt: ShuntConversionTime.SHUNT_CONVERSION_TIME_8244_US, avgMode: AveragingMode.AVERAGING_NUM_SAMPLES_1}
      } else if(interval <= 32) {
        return {shunt: ShuntConversionTime.SHUNT_CONVERSION_TIME_1100_US, avgMode: AveragingMode.AVERAGING_NUM_SAMPLES_16}
      } else if(interval <= 64) {
        return {shunt: ShuntConversionTime.SHUNT_CONVERSION_TIME_2116_US, avgMode: AveragingMode.AVERAGING_NUM_SAMPLES_16}
      } else if(interval <= 128) {
        return {shunt: ShuntConversionTime.SHUNT_CONVERSION_TIME_1100_US, avgMode: AveragingMode.AVERAGING_NUM_SAMPLES_64}
      } else {
        return {shunt: ShuntConversionTime.SHUNT_CONVERSION_TIME_2116_US, avgMode: AveragingMode.AVERAGING_NUM_SAMPLES_64}
      }
    }
  }
}
