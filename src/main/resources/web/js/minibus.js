import * as THREE from 'three';
import {GLTFLoader} from "GLTFLoader";

const keyStates = {};


const clock = new THREE.Clock();

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xe0e0e0 );
scene.fog = new THREE.Fog( 0xe0e0e0, 20, 100 );

const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 2, 1000 );
camera.position.set( - 5, 3, 10 );
camera.rotation.order = 'YXZ';

const fillLight1 = new THREE.HemisphereLight( 0x4488bb, 0x002244, 0.5 );
fillLight1.position.set( 2, 1, 1 );
scene.add( fillLight1 );

// light

const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
hemiLight.position.set( 0, 20, 0 );
scene.add( hemiLight );

const dirLight = new THREE.DirectionalLight( 0xffffff );
dirLight.position.set( 0, 20, 10 );
scene.add( dirLight );

// ground

const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
mesh.rotation.x = - Math.PI / 2;
scene.add( mesh );

const grid = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
grid.material.opacity = 0.2;
grid.material.transparent = true;
scene.add( grid );

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

const container = document.getElementById( 'InGameFrame' );
let renderer, mouseTime

let socket

var joined = new Array(); // 자신을 제외한 나머지 플레이어들 객체
var my; // 자신 객체

const STEPS_PER_FRAME = 5

let character;
const loader = new GLTFLoader()
loader.load( '../model/char.glb', function ( gltf ) {

    character = gltf.scene;
    scene.add( character );

}, undefined, function ( e ) {

    console.error( e );

} );

container.addEventListener( 'mousedown', () => {

    container.requestPointerLock();

    mouseTime = performance.now();

} );

container.addEventListener( 'mousemove', ( event ) => {

    if ( document.pointerLockElement === container ) {

        camera.rotation.y -= event.movementX / 500;

        if(Math.abs(camera.rotation.x - event.movementY / 500) < 1)
            camera.rotation.x -= event.movementY / 500;

    }

} );

container.addEventListener( 'keydown', ( event ) => {
    keyStates[ event.code ] = true;
} );

container.addEventListener( 'keyup', ( event ) => {
    keyStates[ event.code ] = false;
} );

$(function () {

    $("#intro-name").focus();
    $("#select-name").submit(function(event) {
        event.preventDefault();
        const userName = $("#intro-name").val().trim();
        if(userName.trim() == "")
            return;
        my = new Player(userName, 0.0, 0.0, 0.0, 0.0, 0.0);
        joinGame();

    });

});

function joinGame() {
    $("#intro-form").remove();
    $("#InGameFrame").show();
    socket = new WebSocket("ws://" + location.host + "/minibus");

    socket.onopen = function() { // 서버 접속됐을 때
        // 서버에게 내 정보 전송
        const myPacket = new Packet("my", my);
        socket.send(JSON.stringify(myPacket).trim());

        // renderer 적용
        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        container.appendChild( renderer.domElement );

        animate()
        serverRefresh()

    }

    socket.onclose = function() { // 연결 끊어졌을때

    }

    socket.onmessage = function(a) { // 서버한테 메세지 받을 때
        var type = JSON.parse(a.data).type;
        var data = JSON.parse(JSON.parse(a.data).data);
        switch(type) {

            case "join":
                console.log(data)
                joinPlayer(data)
                break;

            case "move":
                if(data.name == my.name)
                    break;
                console.log(getPlayer(data.name))
                getPlayer(data.name).x = data.x;
                getPlayer(data.name).y = data.y;
                getPlayer(data.name).z = data.z;
                getPlayer(data.name).rx = data.rx;
                getPlayer(data.name).ry = data.ry;
                break;
        }
    }

}

function updateOtherPlayer() {
    for(const p of joined) {//character.position.setScalar(camera.position)
        if(p.name == my.name)
            continue
        console.log(p.character)
        p.character.position.set(p.x,0,p.z)
    }
}

function animate() {
    const dt = clock.getDelta()
    for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {

        controls( dt );

        updatePlayer( dt );

    }
    updateOtherPlayer();
    $("#debug").html("[DEBUG]<br>X : "+camera.position.x+"<br>Y : "+camera.position.y+"<br>Z : "+camera.position.z+"<br>Forward : "+ Math.round(camera.rotation.x*100)/100 + ", " + Math.round(camera.rotation.y*100)/100)
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
}

function serverRefresh() {
    setInterval(() => {
        const movePacket = new Packet("move", my);
        socket.send(JSON.stringify(movePacket).trim());

    }, 1000/5);
}

function updatePlayer( deltaTime ) {

    let damping = Math.exp( - 4 * deltaTime ) - 1;
    playerVelocity.addScaledVector( playerVelocity, damping );
    const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
    camera.position.add(deltaPosition)
    my.x=camera.position.x
    my.y=camera.position.y
    my.z=camera.position.z
    character.position.set(my.x, my.y, my.z)
}


function controls(deltaTime) {
    const speedDelta = deltaTime * 10
    if ( keyStates[ 'KeyW' ] ) {
        playerVelocity.add( getForwardVector().multiplyScalar( speedDelta ) );
    }

    if ( keyStates[ 'KeyS' ] ) {
        playerVelocity.add( getForwardVector().multiplyScalar( - speedDelta ) );
    }

    if ( keyStates[ 'KeyA' ] ) {
        playerVelocity.add( getSideVector().multiplyScalar( - speedDelta ) );
    }

    if ( keyStates[ 'KeyD' ] ) {
        playerVelocity.add( getSideVector().multiplyScalar( speedDelta ) );
    }

}

function getForwardVector() {

    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();

    return playerDirection;

}

function getSideVector() {

    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();
    playerDirection.cross( camera.up );

    return playerDirection;

}

function MovePacket(x,y,z,rx,ry) {
    this.x = x;
    this.y = y;
    this.z = y;
    this.rx = rx;
    this.ry = ry;
}

function getPlayer(name)  { // 플레이어 객체 가져오기
    return joined.find(function(item) {
        return item.name == name;
    });
}

function Player(name, x, y, z, rx, ry) { // 플레이어 객체
    this.name = name;
    this.x = x;
    this.y = y;
    this.z = z;
    this.rx = rx;
    this.ry = ry;
    this.character = null
}

function Packet(type, data) {
    this.type = type;
    this.data = data;
}

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function joinPlayer(player) {
    if(player.name == my.name) {
        joined.push(my)
    } else {
        loader.load( '../model/char.glb', function ( gltf ) {

            player.character = gltf.scene;
            scene.add( player.character );
            joined.push(player)

        }, undefined, function ( e ) {

            console.error( e );

        } );
    }
}