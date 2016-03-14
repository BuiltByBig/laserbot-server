import serialport from 'serialport'

export default (io) => {
  serialport.list((err, ports) => {
    console.log('available ports', ports)
    io.emit('available ports', ports)
  })
}
