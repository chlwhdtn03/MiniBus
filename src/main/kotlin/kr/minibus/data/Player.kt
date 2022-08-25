package kr.minibus.data

import kotlinx.serialization.Serializable

@Serializable
data class Player(
    var name: String,
    var x: Double,
    var y: Double,
    var z: Double

)
