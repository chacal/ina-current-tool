import * as React from 'react'
import SocketIO = require('socket.io-client')

interface SamplingState {
  sampling: boolean
}

interface UIState extends SamplingState {
  interval: number
}


export default class App extends React.Component<{}, UIState> {

  constructor() {
    super()
    const io = SocketIO()
    this.state = {sampling: false, interval: 100}

    io.on('sampling-state', (state: SamplingState) => this.setState(state))
    io.on('samples', (sample: Sample[]) => console.log(sample))
  }

  render() {
    return (
      <div className="App">
        <button disabled={this.state.sampling} onClick={this.startSampling}>Start</button>
        <button disabled={!this.state.sampling} onClick={this.stopSampling}>Stop</button>
      </div>
    )
  }

  startSampling = () => httpPost('/start-sampling', {interval: 100})
  stopSampling = () => httpPost('/stop-sampling')
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
