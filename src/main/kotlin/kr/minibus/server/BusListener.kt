package kr.minibus.server

import io.vertx.core.Handler
import io.vertx.core.http.ServerWebSocket
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import kr.minibus.Bus
import kr.minibus.data.BusPacket
import kr.minibus.data.Player

class BusListener : Handler<ServerWebSocket> {
    override fun handle(event: ServerWebSocket?) {
        event?.frameHandler { frame ->// 한 클라이언트가 메세지를 보낼 때
            val packet: BusPacket = Json.decodeFromString(frame.textData())

            when(packet.type) {
                "my" -> {
                    val joinedPlayer = Json.decodeFromString<Player>(packet.data.toString())
                    println(joinedPlayer.name + " Joined")
                    Bus.onlinePlayers.add(joinedPlayer)
                }
            }
        }
    }

}