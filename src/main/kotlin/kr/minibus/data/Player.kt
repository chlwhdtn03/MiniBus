package kr.minibus.data

import io.vertx.core.http.ServerWebSocket
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Serializable
data class Player(
    var name: String,
    var x: Double,
    var y: Double,
    var z: Double,
    var rx: Double,
    var ry: Double,
    @Transient
    var ws: ServerWebSocket? = null
) {
    override fun toString(): String = Json.encodeToString(this)
}
