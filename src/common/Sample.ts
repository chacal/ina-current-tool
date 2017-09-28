interface HrTime {
  seconds: number,
  nanos: number
}

interface Sample {
  value: number,
  hrtime: HrTime
}
