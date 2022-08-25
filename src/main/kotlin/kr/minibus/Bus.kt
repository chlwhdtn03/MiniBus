package kr.minibus

import kr.minibus.data.Player

object Bus {
    var isServerOpen: Boolean = false
    val port: Int = 80

    val onlinePlayers = ArrayList<Player>()
}