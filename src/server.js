import connect from './connect'
import express from 'express'
import http from 'http'
import listDevices from './list'
import serialport, { SerialPort } from 'serialport'
import socketio from 'socket.io'

const app = express()
const server = http.Server(app)
const io = socketio(server)

io.on('connection', (socket) => {
  console.log('a user connected')

  // List serial ports
  serialport.list((err, ports) => {
    console.log('available ports', ports)
    io.emit('available ports', ports)
  })

  socket.on('error', (err) => {
    console.error('Socket error:', err.stack)
  })

  socket.on('connect to device', (device, onOpen) => {

    const conn = new SerialPort(device, {
      baudrate: 115200,
      openImmediately: false,
      parser: serialport.parsers.readline('\r\n')
    })

    conn.on('open', () => {

      // Trigger callback when open
      onOpen(null)

      console.log('serial connection opened')
      socket.emit('serial connect')

      socket.on('send command', (data, callback) => {
        console.log('recieved command from client:', data)

        conn.write(data + '\r\n', (err, result) => {
          if (err) {
            console.log('err', err)
            return callback(err)
          }
          console.log('result', result)
          callback(null)
        })
      })
    })

    conn.on('data', (data) => {
      console.log('received data from device:', data)
      socket.emit('response', data)
    })

    conn.on('error', (err) => {
      console.error('serial error', err)
      socket.emit('serial error', error)
    })

    conn.on('close', async () => {
      console.log('serial connection closed')
      socket.emit('serial disconnect')
      //await attemptReconnect(conn, socket)
    })

    socket.on('disconnect from device', (callback) => {
      console.log('disconnect from device')
      socket.emit('serial disconnect')
      conn.close()
      callback(null)
    })
  })

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
})

server.listen(3000, () => {
  console.log('listening on *:3000')
})
