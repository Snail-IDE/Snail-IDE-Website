import * as Three from "three";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory";
// import BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
// import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
// import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const SESSION_TYPE = "immersive-vr";

function toRad(deg) {
    return deg * (Math.PI / 180);
}
function toDeg(rad) {
    return rad * (180 / Math.PI);
}

class ButtonHandler {
    
}
class VRHandler {
    constructor() {
        /**
         * @type {Three.Scene}
         */
        this.scene = null;
        /**
         * @type {Three.Camera}
         */
        this.camera = null;
        /**
         * @type {Three.WebGLRenderer}
         */
        this.renderer = null;

        /**
         * Whether or not a session has been created.
         * @type {boolean}
         */
        this.isStarted = false;
        /**
         * @type {XRSession}
         */
        this.session = null;

        /**
         * @type {Three.Group}
         */
        this.group = null;
        /**
         * @type {Three.Raycaster}
         */
        this.raycaster = null;
        this.tempMatrix = new Three.Matrix4();

        this.audioElements = {
            background: new Audio("https://snail-ide.vercel.app/vr/wind.mp3"),

            type: new Audio("https://snail-ide.vercel.app/vr/type.mp3"),
            hover: new Audio("https://snail-ide.vercel.app/vr/hover.mp3"),
            enter: new Audio("https://snail-ide.vercel.app/vr/enter.mp3"),
            deselect: new Audio("https://snail-ide.vercel.app/vr/deselect.mp3"),
        };
    }

    static isSupported() {
        if (!("xr" in navigator)) return false;
        return navigator.xr.isSessionSupported(SESSION_TYPE);
    }

    pauseAudioElements() {
        for (const audioElement in this.audioElements) {
            /**
             * @type {HTMLAudioElement}
             */
            const audio = this.audioElements[audioElement];
            if (audio) {
                audio.pause();
            }
        }
    }

    _disposeImmersive() {
        this.session = null;
        this.hideVrCanvas();
        this.pauseAudioElements();
        if (!this.renderer) return;
        this.renderer.xr.enabled = false;
    }
    async _createImmersive() {
        const renderer = this.renderer;
        if (!renderer) return false;

        const sessionInit = {
            optionalFeatures: [
                "local-floor",
                "bounded-floor",
                "hand-tracking",
                "layers",
            ],
        };
        const session = await navigator.xr.requestSession(
            SESSION_TYPE,
            sessionInit
        );
        this.session = session;
        this.isStarted = true;

        // enable xr on three.js
        renderer.xr.enabled = true;
        await renderer.xr.setSession(session);
        this.showVrCanvas();

        session.addEventListener("end", () => {
            this.isStarted = false;
            this.hideVrCanvas();
            this._disposeImmersive();
        });

        // setup render loop
        const drawFrame = () => {
            // breaks the loop once the session has ended
            if (!this.isStarted) return;

            // break loop if no camera or scene
            if (!this.camera) return;
            if (!this.scene) return;

            renderer.render(this.scene, this.camera);
            session.requestAnimationFrame(drawFrame);
        };
        session.requestAnimationFrame(drawFrame);

        // reference space
        session.requestReferenceSpace("local").then((space) => {
            this.localSpace = space;
        });

        // play audio
        this.playSessionAudio();

        return session;
    }
    showVrCanvas() {
        try {
            const canvas = this.renderer.domElement;
            canvas.style.display = "";
        } catch {
            console.warn("tried to show VR canvas");
        }
    }
    hideVrCanvas() {
        try {
            const canvas = this.renderer.domElement;
            canvas.style.display = "none";
        } catch {
            console.warn("tried to hide VR canvas");
        }
    }

    playSessionAudio() {
        this.audioElements.background.loop = true;
        this.audioElements.background.volume = 0.125;
        this.audioElements.background.play();
    }

    initialize() {
        this.scene = new Three.Scene();
        this.renderer = new Three.WebGLRenderer({
            // TODO: is this appropriate config for our use-case?
            preserveDrawingBuffer: true,
            alpha: true,
        });
        this.renderer.setSize(1920, 1080); // TODO: is this too large or does it even matter?
        this.renderer.setClearColor(0x000000, 1);
        this.hideVrCanvas();
        this.camera = new Three.PerspectiveCamera(70, 1920 / 1080, 0.1, 1000);
        // skybox
        const cubeTexLoader = new Three.CubeTextureLoader();
        const skyboxTexture = cubeTexLoader.load([
            "https://snail-ide.vercel.app/vr/skybox_right.png",
            "https://snail-ide.vercel.app/vr/skybox_left.png",
            "https://snail-ide.vercel.app/vr/skybox_top.png",
            "https://snail-ide.vercel.app/vr/skybox_bottom.png",
            "https://snail-ide.vercel.app/vr/skybox_front.png",
            "https://snail-ide.vercel.app/vr/skybox_back.png",
        ]);
        this.scene.background = skyboxTexture;

        this.group = new Three.Group();
        this.scene.add(this.group);

        // platform
        const texLoader = new Three.TextureLoader();
        const platformTexture = texLoader.load(
            "https://snail-ide.vercel.app/vr/platform.png"
        );
        const platformGeometry = new Three.PlaneGeometry(1, 1);
        const platformMaterial = new Three.MeshBasicMaterial({
            map: platformTexture,
            side: Three.DoubleSide,
        });
        const platformObject = new Three.Mesh(platformGeometry, platformMaterial);
        platformObject.position.set(0, 0, 0);
        platformObject.rotateX(toRad(90));
        this.scene.add(platformObject);

        // controllers
        const controller1 = this.renderer.xr.getController(0);
        controller1.addEventListener('selectstart', this.onSelectStart.bind(this));
        controller1.addEventListener('selectend', this.onSelectEnd.bind(this));
        this.scene.add(controller1);

        const controller2 = this.renderer.xr.getController(1);
        controller2.addEventListener('selectstart', this.onSelectStart.bind(this));
        controller2.addEventListener('selectend', this.onSelectEnd.bind(this));
        this.scene.add(controller2);

        const controllerModelFactory = new XRControllerModelFactory();

        const controllerGrip1 = this.renderer.xr.getControllerGrip(0);
        controllerGrip1.add(
            controllerModelFactory.createControllerModel(controllerGrip1)
        );
        this.scene.add(controllerGrip1);

        const controllerGrip2 = this.renderer.xr.getControllerGrip(1);
        controllerGrip2.add(
            controllerModelFactory.createControllerModel(controllerGrip2)
        );
        this.scene.add(controllerGrip2);

        // light
        const light = new Three.SpotLight(0xffffff, 60);
        light.position.set(0, 5, 2.5);
        this.scene.add(light);

        // line
        const lineGeometry = new Three.BufferGeometry().setFromPoints([
            new Three.Vector3(0, 0, 0),
            new Three.Vector3(0, 0, -1),
        ]);

        const line = new Three.Line(lineGeometry);
        line.name = "line";
        line.scale.z = 5;

        controller1.add(line.clone());
        controller2.add(line.clone());

        this.raycaster = new Three.Raycaster();
        
        // exit button
        const exitTexture = texLoader.load("https://snail-ide.vercel.app/vr/exit.png");
        const exitProgressTexture = texLoader.load("https://snail-ide.vercel.app/vr/white.png");
        const exitMaterial = new Three.MeshBasicMaterial({
            map: exitTexture,
            side: Three.DoubleSide,
        });
        const exitProgressMaterial = new Three.MeshBasicMaterial({
            map: exitProgressTexture,
            side: Three.DoubleSide,
        });
        const exitObject = new Three.Mesh(platformGeometry, exitMaterial);
        const exitProgressObject = new Three.Mesh(platformGeometry, exitProgressMaterial);
        exitObject.userData.button = true;
        exitObject.userData.buttonOpcode = 'exiting';
        exitProgressObject.userData.interactable = false;
        this.group.add(exitObject);
        this.group.add(exitProgressObject);

        // test
        const testCubeGeometry = new Three.BoxGeometry(1, 1, 1);
        const testCubeMaterial = new Three.MeshBasicMaterial({
            color: 0xff0000
        });
        const testCubeObject = new Three.Mesh(testCubeGeometry, testCubeMaterial);
        testCubeObject.position.set(0, 4, -5);
        this.group.add(testCubeObject);
    }

    start() {
        if (this.isStarted) return;
        if (this.session) return;
        return this._createImmersive();
    }
    close() {
        this.isStarted = false;
        this.hideVrCanvas();
        this.pauseAudioElements();
        if (!this.session) return;
        return this.session.end();
    }

    onSelectStart(event) {
        const controller = event.target;
        const intersections = this.getIntersections(controller);
        if (intersections.length > 0) {
            const intersection = intersections[0];

            const object = intersection.object;
            // object.material.emissive.b = 1;
            this.audioElements.hover.currentTime = 0;
            this.audioElements.hover.play();
            controller.attach(object);

            controller.userData.selected = object;
        }
        controller.userData.targetRayMode = event.data.targetRayMode;
    }
    onSelectEnd(event) {
        const controller = event.target;

        if (controller.userData.selected !== undefined) {
            const object = controller.userData.selected;
            this.audioElements.hover.pause();
            this.audioElements.deselect.currentTime = 0;
            this.audioElements.deselect.play();
            this.group.attach(object);

            controller.userData.selected = undefined;
        }
    }
    getIntersections(controller) {
		controller.updateMatrixWorld();
		this.tempMatrix.identity().extractRotation(controller.matrixWorld);
		this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
		this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);
		return this.raycaster.intersectObjects(this.group.children, false);
	}
}

export default VRHandler;
