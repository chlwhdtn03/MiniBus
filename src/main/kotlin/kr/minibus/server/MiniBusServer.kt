package kr.minibus.server

import io.vertx.core.Vertx
import io.vertx.core.buffer.Buffer
import io.vertx.core.http.HttpServer
import io.vertx.core.http.HttpServerOptions
import io.vertx.ext.web.Router
import io.vertx.ext.web.handler.sockjs.SockJSHandler
import io.vertx.ext.web.handler.sockjs.SockJSHandlerOptions
import kr.minibus.Bus

class MiniBusServer {


    fun start() {
        val vertx = Vertx.vertx()
        val router = Router.router(vertx)

        val options = SockJSHandlerOptions().setHeartbeatInterval(2000)
        val sockJSHandler = SockJSHandler.create(vertx, options)

        val mainServer: HttpServer = vertx.createHttpServer(HttpServerOptions().setPort(Bus.port)).requestHandler { req ->

            try {
                javaClass.getResourceAsStream("/web" + if (req.path().equals("/")) "/index.html" else req.path())
                    .use { `in` ->
                        val data = ByteArray(1024)
                        var size: Int
                        val buffer: Buffer = Buffer.buffer()
                        while (`in`.read(data).also { size = it } != -1) {
                            buffer.appendBytes(data, 0, size)
                        }
                        req.response().end(buffer)
                    }
            } catch (e: Exception) {
                println("ERROR ${req.path()}")
                req.response().setStatusCode(404).end()
            }

        }.webSocketHandler(BusListener())
            .listen {
                Bus.isServerOpen = it.succeeded()
                println("Server ${if(Bus.isServerOpen) "Opened" else "Failed"}")
            }

    }

}