import serialport, { SerialPort } from 'serialport'

export default (socket) => {

  return (device) => {

    // Connect to port
    const conn = new SerialPort(device, {
      baudrate: 115200,
      openImmediately: false,
      parser: serialport.parsers.readline('\r\n')
    })

    conn.on('open', () => {
      socket.emit('response', 'opened')

      socket.on('send command', (data) => {
        console.log('data', data)
        conn.write(data + '\r\n', (err, result) => {
          console.log('err', err)
          console.log('result', result)
        })
      })
    })

    conn.on('data', (data) => {
      console.log('data', data)
      socket.emit('response', data)
    })

    conn.on('error', (err) => {
      socket.emit('response', `error: ${err}`)
    })

    conn.on('close', async () => {
      socket.emit('response', 'closed')
      await attemptReconnect(conn, socket)
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
