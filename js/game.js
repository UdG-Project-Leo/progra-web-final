var Colors = {
	red: 0xf25346,
	white: 0xd8d0d1,
	brown: 0x59332e,
	pink: 0xF5986E,
	brownDark: 0x23190f,
	blue: 0x68c3c0,
	black: 0x000000,
	redfire: 0xf40921,
	yellow: 0xffd200,
	bluesky: 0x03f0fc,
	brown2: 0x633404,
	orange: 0xff6f00,
};

///////////////

// GAME VARIABLES
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];

function resetGame() {
	game = {
		speed: 0,
		initSpeed: .00035,
		baseSpeed: .00035,
		targetBaseSpeed: .00035,
		incrementSpeedByTime: .0000025,
		incrementSpeedByLevel: .000005,
		distanceForSpeedUpdate: 100,
		speedLastUpdate: 0,

		distance: 0,
		ratioSpeedDistance: 50,
		energy: 250,
		ratioSpeedEnergy: 3,

		level: 1,
		levelLastUpdate: 0,
		distanceForLevelUpdate: 1000,

		planeDefaultHeight: 100,
		planeAmpHeight: 80,
		planeAmpWidth: 75,
		planeMoveSensivity: 0.005,
		planeRotXSensivity: 0.0008,
		planeRotZSensivity: 0.0004,
		planeFallSpeed: .001,
		planeMinSpeed: 1.2,
		planeMaxSpeed: 1.6,
		planeSpeed: 0,
		planeCollisionDisplacementX: 0,
		planeCollisionSpeedX: 0,

		planeCollisionDisplacementY: 0,
		planeCollisionSpeedY: 0,

		seaRadius: 600,
		seaLength: 800,
		//seaRotationSpeed:0.006,
		wavesMinAmp: 5,
		wavesMaxAmp: 20,
		wavesMinSpeed: 0.001,
		wavesMaxSpeed: 0.003,

		cameraFarPos: 500,
		cameraNearPos: 150,
		cameraSensivity: 0.002,

		coinDistanceTolerance: 15,
		coinValue: 3,
		coinsSpeed: .5,
		coinLastSpawn: 0,
		distanceForCoinsSpawn: 100,

		ennemyDistanceTolerance: 10,
		ennemyValue: 10,
		ennemiesSpeed: .6,
		ennemyLastSpawn: 0,
		distanceForEnnemiesSpawn: 50,

		status: "playing",
	};
	fieldLevel.innerHTML = Math.floor(game.level);
}

var scene,
	camera, fieldOfView, aspectRatio, nearPlane, farPlane,
	HEIGHT, WIDTH,
	renderer,
	container,
	Controls;

function createScene() {

	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;

	scene = new THREE.Scene();
	aspectRatio = WIDTH / HEIGHT;
	fieldOfView = 50;
	nearPlane = .1;
	farPlane = 10000;
	camera = new THREE.PerspectiveCamera(
		fieldOfView,
		aspectRatio,
		nearPlane,
		farPlane
	);
	scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
	camera.position.x = 0;
	camera.position.z = 200;
	camera.position.y = game.planeDefaultHeight;
	//camera.lookAt(new THREE.Vector3(0, 400, 0));

	renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
	renderer.setSize(WIDTH, HEIGHT);

	renderer.shadowMap.enabled = true;

	container = document.getElementById('world');
	container.appendChild(renderer.domElement);

	window.addEventListener('resize', handleWindowResize, false);
}

var mousePos = { x: 0, y: 0 };

function handleMouseMove(event) {
	var tx = -1 + (event.clientX / WIDTH) * 2;
	var ty = 1 - (event.clientY / HEIGHT) * 2;
	mousePos = { x: tx, y: ty };
}

function handleWindowResize() {
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	renderer.setSize(WIDTH, HEIGHT);
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
}

function handleTouchMove(event) {
	event.preventDefault();
	var tx = -1 + (event.touches[0].pageX / WIDTH) * 2;
	var ty = 1 - (event.touches[0].pageY / HEIGHT) * 2;
	mousePos = { x: tx, y: ty };
}

function handleMouseUp(event) {
	if (game.status == "waitingReplay") {
		resetGame();
		hideReplay();
	}
}

function handleTouchEnd(event) {
	if (game.status == "waitingReplay") {
		resetGame();
		hideReplay();
	}
}

var hemisphereLight, shadowLight;

function createLights() {

	hemisphereLight = new THREE.HemisphereLight(0x120361, 0x9508f3, .9)
	ambientLight = new THREE.AmbientLight(0x120366, .5);
	shadowLight = new THREE.DirectionalLight(0xff6f00, 2);
	shadowLight.position.set(150, 350, 350);
	shadowLight.castShadow = true;
	shadowLight.shadow.camera.left = -400;
	shadowLight.shadow.camera.right = 400;
	shadowLight.shadow.camera.top = 400;
	shadowLight.shadow.camera.bottom = -400;
	shadowLight.shadow.camera.near = 1;
	shadowLight.shadow.camera.far = 1000;
	shadowLight.shadow.mapSize.width = 2048;
	shadowLight.shadow.mapSize.height = 2048;

	scene.add(hemisphereLight);
	scene.add(shadowLight);
	scene.add(ambientLight);
}

var AirPlane = function () {

	this.mesh = new THREE.Object3D();

	// Create the cabin
	// var geomCockpit = new THREE.BoxGeometry(60,40,30,1,1,1);
	var geomCockpit = new THREE.BoxGeometry(80, 20, 20, 1, 1, 1);
	var matCockpit = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
	geomCockpit.vertices[7].y -= 10;
	geomCockpit.vertices[7].z += 20;//4
	geomCockpit.vertices[6].y -= 10;//5
	geomCockpit.vertices[6].z -= 20;//5
	geomCockpit.vertices[5].y += 30;//6
	geomCockpit.vertices[5].z += 20;//6
	geomCockpit.vertices[4].y += 30;//7
	geomCockpit.vertices[4].z -= 20;//7

	var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
	cockpit.castShadow = true;
	cockpit.receiveShadow = true;
	this.mesh.add(cockpit);

	// Create the engine
	var geomEngine = new THREE.BoxGeometry(20, 15, 15, 1, 1, 1);
	var matEngine = new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading });
	var engine = new THREE.Mesh(geomEngine, matEngine);
	geomEngine.vertices[7].y -= 5;
	geomEngine.vertices[7].z += 10;
	geomEngine.vertices[6].y -= 5;
	geomEngine.vertices[6].z -= 10;
	geomEngine.vertices[5].y += 15;
	geomEngine.vertices[5].z += 10;
	geomEngine.vertices[4].y += 15;
	geomEngine.vertices[4].z -= 10;
	engine.position.x = 40;
	engine.castShadow = true;
	engine.receiveShadow = true;
	this.mesh.add(engine);

	// Create the tail   new THREE.BoxGeometry(20,30,20,1,1,1);
	var geomTailPlane = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
	var matTailPlane = new THREE.MeshPhongMaterial({ color: Colors.black, shading: THREE.FlatShading });
	var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);

	geomTailPlane.vertices[4].y -= 5;
	geomTailPlane.vertices[4].z += 15;
	geomTailPlane.vertices[5].y -= 5;
	geomTailPlane.vertices[5].z -= 15;
	geomTailPlane.vertices[6].y += 25;
	geomTailPlane.vertices[6].z += 15;
	geomTailPlane.vertices[7].y += 25;
	geomTailPlane.vertices[7].z -= 15;

	tailPlane.position.set(-50, 10, 0);
	tailPlane.castShadow = true;
	tailPlane.receiveShadow = true;
	this.mesh.add(tailPlane);

	//fire
	var geomfire = new THREE.BoxGeometry(15, 15, 15, 1, 1, 1);
	var matfire = new THREE.MeshPhongMaterial({ color: Colors.redfire, shading: THREE.FlatShading });
	var fire = new THREE.Mesh(geomfire, matfire);

	fire.position.set(-65, 20, 0);
	fire.castShadow = true;
	fire.receiveShadow = true;
	this.mesh.add(fire);

	//fire2
	var geomfire2 = new THREE.BoxGeometry(10, 10, 10, 1, 1, 1);
	var matfire2 = new THREE.MeshPhongMaterial({ color: Colors.yellow, shading: THREE.FlatShading });
	var fire2 = new THREE.Mesh(geomfire2, matfire2);
	fire2.position.set(-75, 20, 0);
	fire2.castShadow = true;
	fire2.receiveShadow = true;
	this.mesh.add(fire2);

	// Create the wing
	var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
	var matSideWing = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
	var sideWing = new THREE.Mesh(geomSideWing, matSideWing);

	sideWing.castShadow = true;
	sideWing.receiveShadow = true;
	this.mesh.add(sideWing);

	// propeller
	var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
	var matPropeller = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
	this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
	this.propeller.castShadow = true;
	this.propeller.receiveShadow = true;

	//cabin

	var geomcabin = new THREE.BoxGeometry(30, 20, 15, 1, 1, 1);
	var matcabin = new THREE.MeshPhongMaterial({ color: Colors.bluesky, shading: THREE.FlatShading });
	var cabin = new THREE.Mesh(geomcabin, matcabin);
	cabin.position.set(15, 15, 0);
	cabin.castShadow = true;
	cabin.receiveShadow = true;
	this.mesh.add(cabin);

};

Sky = function () {
	// this.mesh = new THREE.Object3D();
	// this.nClouds = 100;
	// this.clouds = [];
	// var stepAngle = Math.PI*2 / this.nClouds;
	// for(var i=0; i<this.nClouds; i++){
	//   var c = new Cloud();
	//   this.clouds.push(c);
	//   var a = stepAngle*i;
	//   var h = 750 + Math.random()*100;
	//   c.mesh.position.y = Math.sin(a)*h;
	//   c.mesh.position.x = Math.cos(a)*h;
	//   c.mesh.position.z = -400-Math.random()*400;
	//   c.mesh.rotation.z = a + Math.PI/2;
	//   var s = 1+Math.random()*2;
	//   c.mesh.scale.set(s,s,s);
	//   this.mesh.add(c.mesh);
	// }
	this.mesh = new THREE.Object3D();
	this.nClouds = 20;
	this.clouds = [];
	var stepAngle = Math.PI * 2 / this.nClouds;
	for (var i = 0; i < this.nClouds; i++) {
		var c = new Cloud();
		this.clouds.push(c);
		var a = stepAngle * i;
		var h = game.seaRadius + 150 + Math.random() * 200;
		c.mesh.position.y = Math.sin(a) * h;
		c.mesh.position.x = Math.cos(a) * h;
		c.mesh.position.z = -300 - Math.random() * 500;
		c.mesh.rotation.z = a + Math.PI / 2;
		var s = 1 + Math.random() * 2;
		c.mesh.scale.set(s, s, s);
		this.mesh.add(c.mesh);
	}
}

Sky.prototype.moveClouds = function () {
	for (var i = 0; i < this.nClouds; i++) {
		var c = this.clouds[i];
		c.rotate();
	}
	this.mesh.rotation.z += game.speed * deltaTime;

}

Sea = function () {
	var geom = new THREE.CylinderGeometry(game.seaRadius, game.seaRadius, game.seaLength, 40, 10);
	geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
	geom.mergeVertices();
	var l = geom.vertices.length;

	this.waves = [];

	for (var i = 0; i < l; i++) {
		var v = geom.vertices[i];
		//v.y = Math.random()*30;
		this.waves.push({
			y: v.y,
			x: v.x,
			z: v.z,
			ang: Math.random() * Math.PI * 2,
			amp: game.wavesMinAmp + Math.random() * (game.wavesMaxAmp - game.wavesMinAmp),
			speed: game.wavesMinSpeed + Math.random() * (game.wavesMaxSpeed - game.wavesMinSpeed)
		});
	};
	var mat = new THREE.MeshPhongMaterial({
		color: Colors.orange,
		transparent: true,
		opacity: .8,
		shading: THREE.FlatShading,

	});

	this.mesh = new THREE.Mesh(geom, mat);
	this.mesh.name = "waves";
	this.mesh.receiveShadow = true;
}

Sea.prototype.moveWaves = function () {

	var verts = this.mesh.geometry.vertices;
	var l = verts.length;
	for (var i = 0; i < l; i++) {
		var v = verts[i];
		var vprops = this.waves[i];
		v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
		v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
		vprops.ang += vprops.speed * deltaTime;
		this.mesh.geometry.verticesNeedUpdate = true;
	}

}

Cloud = function () {
	this.mesh = new THREE.Object3D();
	this.mesh.name = "cloud";
	const radius = 4;
	var geom = new THREE.CubeGeometry(20, 20, 20);
	var mat = new THREE.MeshPhongMaterial({
		color: Colors.brown,
	});

	var nBlocs = 3 + Math.floor(Math.random() * 3);
	for (var i = 0; i < nBlocs; i++) {
		var m = new THREE.Mesh(geom.clone(), mat);
		m.position.x = i * 15;
		m.position.y = Math.random() * 10;
		m.position.z = Math.random() * 300;
		m.rotation.z = Math.random() * Math.PI * 2;
		m.rotation.y = Math.random() * Math.PI * 2;
		var s = .1 + Math.random() * .9;
		m.scale.set(s, s, s);
		this.mesh.add(m);
		m.castShadow = true;
		m.receiveShadow = true;
	}
}

Cloud.prototype.rotate = function () {
	var l = this.mesh.children.length;
	for (var i = 0; i < l; i++) {
		var m = this.mesh.children[i];
		m.rotation.z += Math.random() * .005 * (i + 1);
		m.rotation.y += Math.random() * .002 * (i + 1);
	}
}

function updateCameraFov() {
	camera.fov = normalize(mousePos.x, -1, 1, 40, 80);
	camera.updateProjectionMatrix();
}

///////////////////////
////gamefunctions/////
/////////////////////

Ennemy = function () {
	var geom = new THREE.TetrahedronGeometry(10, 5);
	var mat = new THREE.MeshPhongMaterial({
		color: Colors.red,
		shininess: 0,
		specular: 0xffffff,
		shading: THREE.FlatShading
	});
	this.mesh = new THREE.Mesh(geom, mat);
	this.mesh.castShadow = true;
	this.angle = 0;
	this.dist = 0;
}

EnnemiesHolder = function () {
	this.mesh = new THREE.Object3D();
	this.ennemiesInUse = [];
}

EnnemiesHolder.prototype.spawnEnnemies = function () {
	var nEnnemies = game.level;

	for (var i = 0; i < nEnnemies; i++) {
		var ennemy;
		if (ennemiesPool.length) {
			ennemy = ennemiesPool.pop();
		} else {
			ennemy = new Ennemy();
		}

		ennemy.angle = - (i * 0.1);
		ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
		ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
		ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;

		this.mesh.add(ennemy.mesh);
		this.ennemiesInUse.push(ennemy);
	}
}

EnnemiesHolder.prototype.rotateEnnemies = function () {
	for (var i = 0; i < this.ennemiesInUse.length; i++) {
		var ennemy = this.ennemiesInUse[i];
		ennemy.angle += game.speed * deltaTime * game.ennemiesSpeed;

		if (ennemy.angle > Math.PI * 2) ennemy.angle -= Math.PI * 2;

		ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
		ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;
		ennemy.mesh.rotation.z += Math.random() * .1;
		ennemy.mesh.rotation.y += Math.random() * .1;

		//var globalEnnemyPosition =  ennemy.mesh.localToWorld(new THREE.Vector3());
		var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
		var d = diffPos.length();
		if (d < game.ennemyDistanceTolerance) {
			particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.red, 3);

			ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
			this.mesh.remove(ennemy.mesh);
			game.planeCollisionSpeedX = 100 * diffPos.x / d;
			game.planeCollisionSpeedY = 100 * diffPos.y / d;
			ambientLight.intensity = 2;

			removeEnergy();
			i--;
		} else if (ennemy.angle > Math.PI) {
			ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
			this.mesh.remove(ennemy.mesh);
			i--;
		}
	}
}

Particle = function () {
	var geom = new THREE.TetrahedronGeometry(3, 0);
	var mat = new THREE.MeshPhongMaterial({
		color: 0x009999,
		shininess: 0,
		specular: 0xffffff,
		shading: THREE.FlatShading
	});
	this.mesh = new THREE.Mesh(geom, mat);
}

Particle.prototype.explode = function (pos, color, scale) {
	var _this = this;
	var _p = this.mesh.parent;
	this.mesh.material.color = new THREE.Color(color);
	this.mesh.material.needsUpdate = true;
	this.mesh.scale.set(scale, scale, scale);
	var targetX = pos.x + (-1 + Math.random() * 2) * 50;
	var targetY = pos.y + (-1 + Math.random() * 2) * 50;
	var speed = .6 + Math.random() * .2;
	TweenMax.to(this.mesh.rotation, speed, { x: Math.random() * 12, y: Math.random() * 12 });
	TweenMax.to(this.mesh.scale, speed, { x: .1, y: .1, z: .1 });
	TweenMax.to(this.mesh.position, speed, {
		x: targetX, y: targetY, delay: Math.random() * .1, ease: Power2.easeOut, onComplete: function () {
			if (_p) _p.remove(_this.mesh);
			_this.mesh.scale.set(1, 1, 1);
			particlesPool.unshift(_this);
		}
	});
}

ParticlesHolder = function () {
	this.mesh = new THREE.Object3D();
	this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function (pos, density, color, scale) {

	var nPArticles = density;
	for (var i = 0; i < nPArticles; i++) {
		var particle;
		if (particlesPool.length) {
			particle = particlesPool.pop();
		} else {
			particle = new Particle();
		}
		this.mesh.add(particle.mesh);
		particle.mesh.visible = true;
		var _this = this;
		particle.mesh.position.y = pos.y;
		particle.mesh.position.x = pos.x;
		particle.explode(pos, color, scale);
	}
}

Coin = function () {
	var geom = new THREE.TetrahedronGeometry(6, 0);
	var mat = new THREE.MeshPhongMaterial({
		color: 0x009999,
		shininess: 0,
		specular: 0xffffff,

		shading: THREE.FlatShading
	});
	this.mesh = new THREE.Mesh(geom, mat);
	this.mesh.castShadow = true;
	this.angle = 0;
	this.dist = 0;
}

CoinsHolder = function (nCoins) {
	this.mesh = new THREE.Object3D();
	this.coinsInUse = [];
	this.coinsPool = [];
	for (var i = 0; i < nCoins; i++) {
		var coin = new Coin();
		this.coinsPool.push(coin);
	}
}

CoinsHolder.prototype.spawnCoins = function () {

	var nCoins = 1 + Math.floor(Math.random() * 10);
	var d = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
	var amplitude = 10 + Math.round(Math.random() * 10);
	for (var i = 0; i < nCoins; i++) {
		var coin;
		if (this.coinsPool.length) {
			coin = this.coinsPool.pop();
		} else {
			coin = new Coin();
		}
		this.mesh.add(coin.mesh);
		this.coinsInUse.push(coin);
		coin.angle = - (i * 0.02);
		coin.distance = d + Math.cos(i * .5) * amplitude;
		coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle) * coin.distance;
		coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
	}
}

CoinsHolder.prototype.rotateCoins = function () {
	for (var i = 0; i < this.coinsInUse.length; i++) {
		var coin = this.coinsInUse[i];
		if (coin.exploding) continue;
		coin.angle += game.speed * deltaTime * game.coinsSpeed;
		if (coin.angle > Math.PI * 2) coin.angle -= Math.PI * 2;
		coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle) * coin.distance;
		coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
		coin.mesh.rotation.z += Math.random() * .1;
		coin.mesh.rotation.y += Math.random() * .1;

		//var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
		var diffPos = airplane.mesh.position.clone().sub(coin.mesh.position.clone());
		var d = diffPos.length();
		if (d < game.coinDistanceTolerance) {
			this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
			this.mesh.remove(coin.mesh);
			particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, .8);
			addEnergy();
			i--;
		} else if (coin.angle > Math.PI) {
			this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
			this.mesh.remove(coin.mesh);
			i--;
		}
	}
}

var airplane;

function createPlane() {
	airplane = new AirPlane();
	airplane.mesh.scale.set(.25, .25, .25);
	airplane.mesh.position.y = game.planeDefaultHeight;
	scene.add(airplane.mesh);
}

var sea;

function createSea() {
	sea = new Sea();
	sea.mesh.position.y = -game.seaRadius;
	scene.add(sea.mesh);
}

var sky;

function createSky() {
	sky = new Sky();
	sky.mesh.position.y = -game.seaRadius;;
	scene.add(sky.mesh);
}


function createCoins() {

	coinsHolder = new CoinsHolder(20);
	scene.add(coinsHolder.mesh)
}

function createEnnemies() {
	for (var i = 0; i < 10; i++) {
		var ennemy = new Ennemy();
		ennemiesPool.push(ennemy);
	}
	ennemiesHolder = new EnnemiesHolder();
	//ennemiesHolder.mesh.position.y = -game.seaRadius;
	scene.add(ennemiesHolder.mesh)
}

function createParticles() {
	for (var i = 0; i < 10; i++) {
		var particle = new Particle();
		particlesPool.push(particle);
	}
	particlesHolder = new ParticlesHolder();
	//ennemiesHolder.mesh.position.y = -game.seaRadius;
	scene.add(particlesHolder.mesh)
}

function loop() {

	newTime = new Date().getTime();
	deltaTime = newTime - oldTime;
	oldTime = newTime;

	if (game.status == "playing") {

		// Add energy coins every 100m;
		if (Math.floor(game.distance) % game.distanceForCoinsSpawn == 0 && Math.floor(game.distance) > game.coinLastSpawn) {
			game.coinLastSpawn = Math.floor(game.distance);
			coinsHolder.spawnCoins();
		}

		if (Math.floor(game.distance) % game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate) {
			game.speedLastUpdate = Math.floor(game.distance);
			game.targetBaseSpeed += game.incrementSpeedByTime * deltaTime;
		}


		if (Math.floor(game.distance) % game.distanceForEnnemiesSpawn == 0 && Math.floor(game.distance) > game.ennemyLastSpawn) {
			game.ennemyLastSpawn = Math.floor(game.distance);
			ennemiesHolder.spawnEnnemies();
		}

		if (Math.floor(game.distance) % game.distanceForLevelUpdate == 0 && Math.floor(game.distance) > game.levelLastUpdate) {
			game.levelLastUpdate = Math.floor(game.distance);
			game.level++;
			fieldLevel.innerHTML = Math.floor(game.level);

			game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel * game.level
		}


		updatePlane();
		updateDistance();
		updateEnergy();
		game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
		game.speed = game.baseSpeed * game.planeSpeed;

	} else if (game.status == "gameover") {
		game.speed *= .99;
		airplane.mesh.rotation.z += (-Math.PI / 2 - airplane.mesh.rotation.z) * .0002 * deltaTime;
		airplane.mesh.rotation.x += 0.0003 * deltaTime;
		game.planeFallSpeed *= 1.05;
		airplane.mesh.position.y -= game.planeFallSpeed * deltaTime;

		if (airplane.mesh.position.y < -200) {
			showReplay();
			console.log(username, Math.floor(game.distance));
			saveScore(username, Math.floor(game.distance));
			game.status = "waitingReplay";

		}
	} else if (game.status == "waitingReplay" || game.status == "enterUsername") {

	}

	// sky.mesh.rotation.z += .01;

	airplane.propeller.rotation.x += .2 + game.planeSpeed * deltaTime * .005;
	sea.mesh.rotation.z += game.speed * deltaTime;//*game.seaRotationSpeed;

	if (sea.mesh.rotation.z > 2 * Math.PI) sea.mesh.rotation.z -= 2 * Math.PI;

	ambientLight.intensity += (.5 - ambientLight.intensity) * deltaTime * 0.005;


	coinsHolder.rotateCoins();
	ennemiesHolder.rotateEnnemies();

	sky.moveClouds();
	sea.moveWaves();

	renderer.render(scene, camera);
	requestAnimationFrame(loop);
}

var blinkEnergy = false;

function updateDistance() {
	game.distance += game.speed * deltaTime * game.ratioSpeedDistance;
	fieldDistance.innerHTML = Math.floor(game.distance);
	var d = 502 * (1 - (game.distance % game.distanceForLevelUpdate) / game.distanceForLevelUpdate);
	levelCircle.setAttribute("stroke-dashoffset", d);

}

function updateEnergy() {
	game.energy -= game.speed * deltaTime * game.ratioSpeedEnergy;
	game.energy = Math.max(0, game.energy);
	energyBar.style.right = (100 - game.energy) + "%";
	energyBar.style.backgroundColor = (game.energy < 50) ? "#f25346" : "#68c3c0";

	if (game.energy < 30) {
		energyBar.style.animationName = "blinking";
	} else {
		energyBar.style.animationName = "none";
	}

	if (game.energy < 1) {
		game.status = "gameover";
	}
}

function addEnergy() {
	game.energy += game.coinValue;
	game.energy = Math.min(game.energy, 100);
}

function removeEnergy() {
	game.energy -= game.ennemyValue;
	game.energy = Math.max(0, game.energy);
}

function updatePlane() {

	game.planeSpeed = normalize(mousePos.x, -.5, .5, game.planeMinSpeed, game.planeMaxSpeed);
	var targetY = normalize(mousePos.y, -.75, .75, game.planeDefaultHeight - game.planeAmpHeight, game.planeDefaultHeight + game.planeAmpHeight);
	var targetX = normalize(mousePos.x, -1, 1, -game.planeAmpWidth * .7, -game.planeAmpWidth);

	game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
	targetX += game.planeCollisionDisplacementX;


	game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
	targetY += game.planeCollisionDisplacementY;

	airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * deltaTime * game.planeMoveSensivity;
	airplane.mesh.position.x += (targetX - airplane.mesh.position.x) * deltaTime * game.planeMoveSensivity;

	airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * deltaTime * game.planeRotXSensivity;
	airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * deltaTime * game.planeRotZSensivity;
	var targetCameraZ = normalize(game.planeSpeed, game.planeMinSpeed, game.planeMaxSpeed, game.cameraNearPos, game.cameraFarPos);
	camera.fov = normalize(mousePos.x, -1, 1, 40, 80);
	camera.updateProjectionMatrix();
	camera.position.y += (airplane.mesh.position.y - camera.position.y) * deltaTime * game.cameraSensivity;

	game.planeCollisionSpeedX += (0 - game.planeCollisionSpeedX) * deltaTime * 0.03;
	game.planeCollisionDisplacementX += (0 - game.planeCollisionDisplacementX) * deltaTime * 0.01;
	game.planeCollisionSpeedY += (0 - game.planeCollisionSpeedY) * deltaTime * 0.03;
	game.planeCollisionDisplacementY += (0 - game.planeCollisionDisplacementY) * deltaTime * 0.01;



}

function showReplay() {
	replayMessage.style.display = "block";
}

function hideReplay() {
	replayMessage.style.display = "none";
}

function normalize(v, vmin, vmax, tmin, tmax) {
	var nv = Math.max(Math.min(v, vmax), vmin);
	var dv = vmax - vmin;
	var pc = (nv - vmin) / dv;
	var dt = tmax - tmin;
	var tv = tmin + (pc * dt);
	return tv;
}

var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;

function init(event) {

	fieldDistance = document.getElementById("distValue");
	energyBar = document.getElementById("energyBar");
	replayMessage = document.getElementById("replayMessage");
	fieldLevel = document.getElementById("levelValue");
	levelCircle = document.getElementById("levelCircleStroke");

	resetGame();
	createScene();

	createLights();
	createPlane();
	createSea();
	createSky();
	createCoins();
	createEnnemies();
	createParticles();

	document.addEventListener('mousemove', handleMouseMove, false);
	document.addEventListener('touchmove', handleTouchMove, false);
	document.addEventListener('mouseup', handleMouseUp, false);
	document.addEventListener('touchend', handleTouchEnd, false);

	enterUsername();

	loop();
}

// User
var username;
var changeUser = false;

// Username inputs
var usernameInput = document.getElementById('usernameInput');
var usernameLabel = document.getElementById('usernameLabel');
var changeUser = document.getElementById('changeUser');
var btnPlay = document.getElementById('playButton');

// Change user
changeUser.addEventListener('click', event => {
	changeUser = true;
	game.status = 'gameover';
	modal.show();
});

// Username entry
const modalContainer = document.getElementById("usernameModal");
const modal = new bootstrap.Modal(modalContainer);

modalContainer.addEventListener('hidden.bs.modal', setUsername);
btnPlay.addEventListener('click', _ => modal.hide());

function setUsername() {
	username = usernameInput.value == '' ? 'guest' : usernameInput.value;
	usernameLabel.innerText = username;

	if (!changeUser) {
		game.status = 'playing';
	} else {
		changeUser = false;
		resetGame();
		hideReplay();
	}

	usernameInput.value = '';
}

function enterUsername() {
	game.status = 'enterUsername';
	modal.show();
}

// Top Scores
const topModalContainer = document.getElementById("topScoresModal");
const topModal = new bootstrap.Modal(topModalContainer);
const btnTopScores = document.getElementById("topScores");
var tbodyRef = document.getElementById('topScoresTable').getElementsByTagName('tbody')[0];

topModalContainer.addEventListener('shown.bs.modal', () => {
	getTop10Scores();
});

btnTopScores.addEventListener('click', _ => {
	topModal.show();
});

// Firebase Configuration
class Score {
	constructor(username, score) {
		this.username = username;
		this.score = score;
	}
}

// Your web app's Firebase configuration
var firebaseConfig = {
	apiKey: "AIzaSyD78GRSJdV7V4UtQjAax_zqqr_L9hULfdk",
	authDomain: "proyecto-final-progra-web.firebaseapp.com",
	projectId: "proyecto-final-progra-web",
	storageBucket: "proyecto-final-progra-web.appspot.com",
	messagingSenderId: "933404112823",
	appId: "1:933404112823:web:7295ee3b003fb0de745a32"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var database = firebase.database();


// Database methods
function saveScore(username, score) {
	var scoresRef = database.ref('scores/' + username);
	var newScoreRef = scoresRef.push();
	newScoreRef.set({
		score: score
	});
}

function getUserScores(username) {
	var scoresRef = database.ref('scores/' + username);
	scoresRef.once('value', (snapshot) => {
		console.log(snapshot.val());
	});
}

function getTop10Scores() {
	var scoresRef = database.ref('scores');
	var scores = [];

	scoresRef.once('value', (snapshot) => {
		var users = snapshot.val();
		Object.keys(users).forEach(userKey => {
			Object.keys(users[userKey]).forEach(sKey => {
				scores.push(new Score(userKey, users[userKey][sKey].score));
			});
		});

		scores.sort((a, b) => b.score - a.score);
		if (scores.length > 10) {
			scores = scores.slice(0, 10);
		}

		scores.forEach((score, i) => {
			var newRow = tbodyRef.insertRow();
	
			// Insert a cell at the end of the row
			var indexCell = newRow.insertCell();
			var userCell = newRow.insertCell();
			var scoreCell = newRow.insertCell();
			
			indexCell.outerHTML = `<th>${i + 1}</th>`;
	
			// Append a text node to the cell
			userCell.appendChild(document.createTextNode(score.username));
			scoreCell.appendChild(document.createTextNode(score.score));
		});

		console.log(scores);
	});
}


window.addEventListener('load', init, false);
