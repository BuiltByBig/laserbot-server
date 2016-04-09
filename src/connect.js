import serialport, { SerialPort } from 'serialport'

export default (socket) => {

  return (device, onOpen) => {

    // Connect to port
    const conn = new SerialPort(device, {
      baudrate: 115200,
      openImmediately: false,
      parser: serialport.parsers.readline('\r\n')
    })

    conn.on('open', () => {

      // Trigger callback when open
      onOpen(null)

      socket.emit('response', 'serial connection opened')

      socket.on('send command', (data, callback) => {
        console.log('recieved command from clien:', data)

        conn.write(data + '\r\n', (err, result) => {
          if (err) {
            console.log('err', err)
            return callback(err)
          }
          console.log('result', result)
          callback(null)
        })
      })

      // TODO: More commands here....
      //socket.on('send command', (data) => {
        //console.log('data', data)
        //conn.write(data + '\r\n', (err, result) => {
          //console.log('err', err)
          //console.log('result', result)
        //})
      //})

    })

    conn.on('data', (data) => {
      console.log('received data from device:', data)
      socket.emit('response', data)
    })

    conn.on('error', (err) => {
      console.error('serial error', err)
      socket.emit('response', `error: ${err}`)
    })

    conn.on('close', async () => {
      console.log('connection closed')
      socket.emit('response', 'serial connection closed')
      //await attemptReconnect(conn, socket)
    })

    socket.on('disconnect from device', (callback) => {
      console.log('disconnect from device')
      conn.close()
      callback(null)
    })
  }
}

//-----------------------------------
// Hacky reconnect logic
//-----------------------------------
// TODO: allow multiple connection retries
async function attemptReconnect(conn, socket, options = { maxRetries: 10 }) {

  const { maxRetries } = options
  let retries = 0

  function reconnect(delay) {
    socket.emit('response', 'trying to reconnect...')
    console.log('trying to reconnect')

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        conn.open((err, data) => {
          if (err) {
            console.log('error reconnecting', err)
            return reject(err)
          }

          resolve('reconnected')
        })
      }, delay)
    })
  }

  let delay = 1000
  while (retries < maxRetries) {
    console.log('reconnect attempt #' + (retries + 1) + ' (delay ' + delay + ')')

    try {
      if (await reconnect(delay)) {
        socket.emit('response', 'reconnected!')
        console.log('reconnected!')
        retries = maxRetries
        return
      }
    } catch (err) {
      console.log('reconnect err', err)
    }

    delay += 500
    retries += 1
  }
}
