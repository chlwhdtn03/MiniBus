package kr.minibus.server

import io.vertx.core.Handler
import io.vertx.core.http.ServerWebSocket
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import kr.minibus.Bus
import kr.minibus.data.BusPacket
import kr.minibus.data.BusSendPacket
import kr.minibus.data.MovePacket
import kr.minibus.data.Player


class BusListener : Handler<ServerWebSocket> {
    override fun handle(event: ServerWebSocket?) {
        event?.frameHandler { frame ->// 한 클라이언트가 메세지를 보낼 때
            val packet: BusPacket = Json.decodeFromString(frame.textData())

            when(packet.type) {
                "my" -> {
                    val joinedPlayer = Json { ignoreUnknownKeys = true }.decodeFromString<Player>(packet.data.toString())
                    println(joinedPlayer.name + " Joined")
                    joinedPlayer.ws = event
                    Bus.onlinePlayers.add(joinedPlayer)
                    for(p in Bus.onlinePlayers) {
                        send(joinedPlayer.ws, BusSendPacket("join", p.toString()))
                    }
                    sendAll(BusSendPacket("join", joinedPlayer.toString()))
                }
                "move" -> {
                    val movedPlayer = Json { ignoreUnknownKeys = true }.decodeFromString<Player>(packet.data.toString())
                    sendAll(BusSendPacket("move", movedPlayer.toString()))
                }
            }
        }
    }

    fun sendAll(packet: BusSendPacket) {
        for (player: Player in Bus.onlinePlayers) {
            try {
                player.ws?.writeFinalTextFrame(packet.toString())
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun send(ws: ServerWebSocket?, packet: BusSendPacket) {
        try {
            ws?.writeFinalTextFrame(packet.toString())
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

}