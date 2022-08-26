package kr.minibus.data

import kotlinx.serialization.Serializable

@Serializable
data class MovePacket(
    var x: Double,
    var y: Double,
    var z: Double,
    var rx: Double,
    var ry: Double,
)
