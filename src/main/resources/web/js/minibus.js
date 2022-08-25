const keyStates = {};

const clock = new THREE.Clock();

scene = new THREE.Scene();
scene.background = new THREE.Color( 0xe0e0e0 );
scene.fog = new THREE.Fog( 0xe0e0e0, 20, 100 );

const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
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

var joined = new Array(); // 자신을 제외한 나머지 플레이어들 객체
var my; // 자신 객체

const STEPS_PER_FRAME = 5

container.addEventListener( 'mousedown', () => {

    container.requestPointerLock();

    mouseTime = performance.now();

} );

container.addEventListener( 'mousemove', ( event ) => {

    if ( document.pointerLockElement === container ) {

        camera.rotation.y -= event.movementX / 500;
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
        var userName = $("#intro-name").val().trim();
        if(userName.trim() == "")
            return;
        my = new Player(userName, 0, 0);
        joinGame();
    });

});

function joinGame() {
    $("#intro-form").remove();
    $("#InGameFrame").show();
    let socket = new WebSocket("ws://" + location.host + "/minibus");

    socket.onopen = function() { // 서버 접속됐을 때
        // 서버에게 내 정보 전송
        var myPacket = new Packet("my",my);
        socket.send(JSON.stringify(myPacket).trim());

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        container.appendChild( renderer.domElement );

        animate()

    }

    socket.onclose = function() { // 연결 끊어졌을때

    }

    socket.onmessage = function(a) { // 서버한테 메세지 받을 때
        var type = JSON.parse(a.data).type;
        var data = JSON.parse(JSON.parse(a.data).data);
        switch(type) {

            case "move":
                getPlayer(data.name).x = data.x;
                getPlayer(data.name).y = data.y;
                getPlayer(data.name).direction = data.direction;
                break;
        }
    }

}

function animate() {
    const dt = clock.getDelta()
    for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {

        controls( dt );

        updatePlayer( dt );

    }
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
}

function updatePlayer( deltaTime ) {

    let damping = Math.exp( - 4 * deltaTime ) - 1;
    playerVelocity.addScaledVector( playerVelocity, damping );
    const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
    console.log(deltaPosition)
    camera.position.add(deltaPosition)

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

function MovePacket(dx, dy, direction) {
    this.dx = dx;
    this.dy = dy;
    this.direction = direction;
}

function getPlayer(name)  { // 플레이어 객체 가져오기
    return joined.find(function(item) {
        return item.name == name;
    });
}

function Player(name, x, y, z) { // 플레이어 객체
    this.name = name;
    this.x = x;
    this.y = y;
    this.z = z;
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