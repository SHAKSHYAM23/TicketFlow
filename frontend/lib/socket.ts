import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ['websocket'],
    })
  }
  return socket
}

export const joinEventRoom = (eventId: string) => {
  getSocket().emit('join_event', eventId)
}

export const leaveEventRoom = (eventId: string) => {
  getSocket().emit('leave_event', eventId)
}

export const onSeatUpdated = (
  callback: (data: {
    seatId: string
    status: string
    rowLabel: string
    seatNumber: number
  }) => void,
) => {
  getSocket().on('seat_updated', callback)
}

export const offSeatUpdated = () => {
  getSocket().off('seat_updated')
}
