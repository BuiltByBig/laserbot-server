import express from 'express'
import http from 'http'
import serialport, { SerialPort } from 'serialport'
import socketio from 'socket.io'
import listDevices from './list'
import connect from './connect'

const app = express()
const server = http.Server(app)
const io = socketio(server)

io.on('connection', (socket) => {
  console.log('a user connected')

  // List serial ports
  listDevices(io)

  socket.on('connect to device', connect(socket))

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
})

server.listen(3000, () => {
  console.log('listening on *:3000')
})
