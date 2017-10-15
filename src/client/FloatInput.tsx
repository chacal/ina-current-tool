import * as React from 'react'

interface FloatInputProps {
  readonly value: number
  readonly onChange: (value: number) => void
}

interface FloatInputState {
  readonly valueStr: string
}

export default class FloatInput extends React.Component<FloatInputProps, FloatInputState> {
  constructor(props: FloatInputProps) {
    super(props)
    this.state = {valueStr: props.value.toString()}
  }

  componentWillReceiveProps(nextProps: FloatInputProps) {
    if(this.props.value !== nextProps.value) {
      this.setState({valueStr: nextProps.value.toString()})
    }
  }

  render() {
    return <input type="number" step="0.1" min="0.1" value={this.state.valueStr} onChange={evt => this.onChange(evt.target.value)}/>
  }

  private onChange(valueStr: string) {
    this.setState({valueStr})
    const fValue = parseFloat(valueStr)
    if (!isNaN(fValue) && isFinite(fValue)) {
      this.props.onChange(fValue)
    }
  }
}
