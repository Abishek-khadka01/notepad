import { Socket } from "socket.io"
export interface SocketHandler extends Socket {
    userId ?: string

}