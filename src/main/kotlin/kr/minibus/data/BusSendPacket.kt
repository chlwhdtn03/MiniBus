package kr.minibus.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject

@Serializable
data class BusSendPacket(
    val type: String,
    val data: String
) {
    override fun toString(): String = Json.encodeToString(this)
}
