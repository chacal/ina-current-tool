import * as React from 'react'
import FloatInput from './FloatInput'
import SocketIO = require('socket.io-client')

interface UIState extends SamplingState {
  interval: number
  currentSample: Sample | undefined
}


export default class App extends React.Component<{}, UIState> {

  constructor() {
    super()
    const io = SocketIO('/sample-stream')
    this.state = {sampling: false, resistorValue: 0.1, calibration: 0, interval: 100, currentSample: undefined}

    io.on('sampling-state', (state: SamplingState) => this.setState(state))
    io.on('samples', (samples: Sample[]) => this.setState({currentSample: samples[samples.length - 1]}))
  }

  render() {
    return (
      <div className="App">
        <div>
          <select value={this.state.interval} onChange={evt => this.setState({interval: parseInt(evt.target.value, 10)})} disabled={this.state.sampling}>
            <option value={0}>Realtime</option>
            <option value={2}>2ms</option>
            <option value={5}>5ms</option>
            <option value={10}>10ms</option>
            <option value={50}>50ms</option>
            <option value={100}>100ms</option>
            <option value={500}>500ms</option>
            <option value={1000}>1s</option>
            <option value={5000}>5s</option>
          </select>
          <button disabled={this.state.sampling} onClick={this.startSampling}>Start</button>
          <button disabled={!this.state.sampling} onClick={this.stopSampling}>Stop</button>
          <span>{renderSample(this.state.currentSample)}</span>
        </div>
        <div>
          Shunt: <FloatInput value={this.state.resistorValue} onChange={value => this.setState({resistorValue: value})}/>Ω
          <button onClick={this.calibrate}>Set</button>
          <span>Calibration: {this.state.calibration}</span>
          <button onClick={evt => this.setState(prev => ({calibration: prev.calibration + 1}), this.calibrate)}>+</button>
          <button onClick={evt => this.setState(prev => ({calibration: prev.calibration - 1}), this.calibrate)}>-</button>
        </div>
      </div>
    )
  }

  startSampling = () => httpPost('/start-sampling', {interval: this.state.interval})
  stopSampling = () => httpPost('/stop-sampling')
  calibrate = () => httpPost('/calibrate', {resistor: this.state.resistorValue, calibration: this.state.calibration})
}

function renderSample(sample: Sample | undefined) {
  return sample ? `${sample.value}µA (${sample.hrtime.seconds}s ${sample.hrtime.nanos}ns)` : '-'
}

function httpPost(url: string, payload: Object | undefined = undefined) {
  return fetch(url, {
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: payload ? JSON.stringify(payload) : undefined
  })
}
