import i2c = require('i2c-bus')

export enum Registers {
  CONFIG = 0x00,
  SHUNT_VOLTAGE = 0x01,
  BUS_VOLTAGE = 0x02,
  POWER = 0x03,
  CURRENT = 0x04,
  CALIBRATION = 0x05
}

export enum ShuntAdcGain {
  SHUNT_ADC_GAIN_1_40MV       = 0x0000,      // Gain 1, 40mV Range
  SHUNT_ADC_GAIN_2_80MV       = 0x0800,      // Gain 2, 80mV Range
  SHUNT_ADC_GAIN_4_160MV      = 0x1000,      // Gain 4, 160mV Range
  SHUNT_ADC_GAIN_8_320MV      = 0x1800       // Gain 8, 320mV Range
}

export enum ShuntAdcSettings {
  SHUNT_ADC_9BIT_1S_84US     	= 0x0000,      // 1 x 9-bit shunt sample
  SHUNT_ADC_10BIT_1S_148US   	= 0x0008,      // 1 x 10-bit shunt sample
  SHUNT_ADC_11BIT_1S_276US   	= 0x0010,      // 1 x 11-bit shunt sample
  SHUNT_ADC_12BIT_1S_532US   	= 0x0018,      // 1 x 12-bit shunt sample
  SHUNT_ADC_12BIT_2S_1060US  	= 0x0048,      // 2 x 12-bit shunt samples averaged together
  SHUNT_ADC_12BIT_4S_2130US  	= 0x0050,      // 4 x 12-bit shunt samples averaged together
  SHUNT_ADC_12BIT_8S_4260US  	= 0x0058,      // 8 x 12-bit shunt samples averaged together
  SHUNT_ADC_12BIT_16S_8510US 	= 0x0060,      // 16 x 12-bit shunt samples averaged together
  SHUNT_ADC_12BIT_32S_17MS   	= 0x0068,      // 32 x 12-bit shunt samples averaged together
  SHUNT_ADC_12BIT_64S_34MS   	= 0x0070,      // 64 x 12-bit shunt samples averaged together
  SHUNT_ADC_12BIT_128S_69MS  	= 0x0078       // 128 x 12-bit shunt samples averaged together
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

export default class INA219 {
  private i2cBus: any
  private i2cAddress: number

  constructor(i2cBusNumber: number = 1, i2cAddress: number = 0x40) {
    this.i2cBus = i2c.openSync(i2cBusNumber)
    this.i2cAddress = i2cAddress
  }

  configure(gain: ShuntAdcGain, adcSettings: ShuntAdcSettings, mode: OperationMode): void {
    this.i2cBus.writeWordSync(this.i2cAddress, Registers.CONFIG, toMSB(gain + adcSettings + mode))
  }

  getRawShuntSample(): number {
    return twosComplementToInt(toMSB(this.i2cBus.readWordSync(this.i2cAddress, Registers.SHUNT_VOLTAGE)))
  }
}

// Swaps lowest two bytes (e.g. 0x11ff -> 0xff11)
function toMSB(word: number) {
  return ((word & 0xFF) << 8) + ((word >> 8) & 0xFF)
}

function twosComplementToInt(val: number) {
  if(val >> 15 === 1) {
    return -(~val & 0xff) - 1
  } else {
    return val
  }
}
