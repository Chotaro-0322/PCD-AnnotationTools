const {ipcRenderer} = require('electron');
const fs = require('fs');

class ClustaringPlot{
    constructor(){
        // クラスタリングを表示
        this.pos_geometry = new THREE.BufferGeometry();
    }

    cleateObj(array, color){
        console.log("color is ", color);
        var positions;
        var material;
        [positions, material] = this.plotScatter(array, color);
        this.pos_geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
        console.log("bytes_per is", positions.BYTES_PER_ELEMENT);
        var mesh = new THREE.Points(this.pos_geometry, material);

        return mesh;
    }

    cleateCube(array_maxmin, color){
        console.log("color is ", color);
        var x_width = array_maxmin[1][1] - array_maxmin[1][0];
        var y_width = array_maxmin[2][1] - array_maxmin[2][0];
        var z_width = array_maxmin[0][1] - array_maxmin[0][0];

        var cent_x = (array_maxmin[1][1] + array_maxmin[1][0]) / 2;
        var cent_y = (array_maxmin[2][1] + array_maxmin[2][0]) / 2;
        var cent_z = (array_maxmin[0][1] + array_maxmin[0][0]) / 2;

        var cubeGeometry = new THREE.BoxGeometry(x_width, y_width, z_width);
        var cubeMaterial = new THREE.MeshBasicMaterial({
            color :0xff0000,
            wireframe :true,
            wireframeLinewidth:0.7
        });

        var cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cubeMesh.position.set(cent_x, cent_y, cent_z);

        return cubeMesh;
    }

    plotScatter(array, point_color){
        var pos_1len = array.length;
        console.log(pos_1len);
        //console.log("pos_xyz is ", array[0]);
        //console.log("clust is ", array);
        // posを作成
        const positions = new Float32Array(pos_1len*3);
        for (let i = 0; i < pos_1len; i++){
            //console.log("array is ", array[i]);
            positions[i*3] = array[i][1];
            positions[i*3+1] = array[i][2];
            positions[i*3+2] = array[i][0];
        };
        console.log("point_color is", point_color);
        const material = new THREE.PointsMaterial({
            // 1つ1つのサイズ
            size: 0.1,
            // 色
            color: point_color,
        });

        return [positions, material];
    }

}



// ---------------------------main code-------------------------------------------------------------------
//const cryptoRandomString = require('crypto-random-string');

//window.addEventListener('DOMContentLoaded', scatter);

//function scatter() {
var canvas = document.querySelector('#myCanvas');

// レンダラーを作成
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
});

const canv_width = 1000;
const canv_high = 700;

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canv_width, canv_high);

// mouseの座標を取得
var boxobj;
var mouseoveredObj;
var plane = new THREE.Plane();
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var offset = new THREE.Vector3();
var intersection = new THREE.Vector3();

// canvas.addEventListener('mousedown', mousedownEvent, false );
// canvas.addEventListener('mousemove', mousemoveEvent, false );
// canvas.addEventListener('mouseup', mouseupEvent, false );
// シーンを作成
const scene = new THREE.Scene();

// カメラを作成
const camera = new THREE.PerspectiveCamera( 70, canv_width / canv_high, 1, 10000);

// レンダラーが描画するキャンバスサイズの設定
//renderer.setSize( window.innerWidth, window.innerHeight );
// キャンバスをDOMツリーに追加
//document.body.appendChild( renderer.domElement );

//camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.position.set(0, 0, 0);
const radian = 180* Math.PI / 180;
camera.position.x = 10 * Math.sin(radian);
camera.position.z = 10 * Math.cos(radian);
// カメラの操作
var controls = new THREE.TrackballControls(camera);
controls.rotateSpeed = 3.0;
controls.zoomSpeed = 1.2;
controls.panSpeed = 1.0;
controls.noZoom = false;
controls.noPan = false;
controls.staticMoving = true;
controls.dynamicDampingFactor = 0.3;

// Gridの作成
const gridHelper = new THREE.GridHelper(200, 50, 0x696969, 0x696969);
gridHelper.position.x = 0;
gridHelper.position.y = -2;
gridHelper.position.z = 0;
scene.add(gridHelper);

// Gridの軸の作成
const axes = new THREE.AxisHelper(3);
axes.position.y = -2;
scene.add(axes);

// test--------------------------------------------------------------
// var object = [];
// var geometry = new THREE.BoxGeometry(1, 1, 1);
// var material_box = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// // オブジェクトの作成
// var cube = new THREE.Mesh( geometry, material_box );
// // オブジェクトの位置調整
// cube.position.x = 2.0;
// // オブジェクトをシーンに追加
// scene.add(cube);
// object.push(cube);
// ------------------------------------------------------------------

// npy ファイルの一覧を出す
//var npy_list = npy_search();
var txt_list = txt_search();
//ipcRenderer.send('pcl_process', npy_list[0]);
console.log("txt_list is ", txt_list);
ipcRenderer.send('pcl_process', txt_list);

var jsondat = JSON.parse(fs.readFileSync('./src/clustaring_data.json', 'utf8') || "null");
var all_data = jsondat["all_data"];
var pos_xyz = jsondat["only_xyz"];
var clust_data = jsondat["clustaring_data"];
var clust_maxmin = jsondat["clust_maxmin"];
//console.log("clust is", clust_maxmin);

// 全体のpos_xyzを表示
const pos_geometry = new THREE.BufferGeometry();
const point_color = 0xffffff;
let positions;
let material;
[positions, material] = plotScatter(pos_xyz, point_color);
pos_geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
const mesh = new THREE.Points(pos_geometry, material);
scene.add(mesh);

// クラスタリングを表示
const clust_1len = clust_data.length;
    // 色をランダムで作成
var color_list = [];
for (let i = 0; i < clust_1len; i++){
    //色を白に近すぎない範囲でランダムに抽出
    var red = Math.floor(Math.random() * 220 + 30);
    var green = 255 - red;
    var blue = Math.floor(Math.random() * 220 + 30);
    var randomColor = "rgb("+red.toString()+","+green.toString()+","+blue.toString()+")";
    color_list.push(randomColor);
};
for(let i = 0; i < clust_1len; i++){
    //evalによってクラスターごとにmeshを生成
    eval("var clust_"+i+" = new ClustaringPlot()");
    eval("var mesh_"+i+" = clust_"+i+".cleateObj(clust_data["+i+"], color_list["+i+"])");
    // eval("var cubemesh_"+i+" = clust_"+i+".cleateCube(clust_maxmin["+i+"], color_list["+i+"])");
    eval("scene.add(mesh_"+i+")");
    // eval("scene.add(cubemesh_"+i+")");
    // eval("object.push(cubemesh_"+i+")");
};

//sceneの設定を表示
console.log("scene is", scene);


//table_con();
tick();

//}



// 毎フレーム時に実行されるループイベントです
function tick() {
    requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera); // レンダリング
    //renderer.render(box_scene, camera); // レンダリング
}

function plotScatter(array, point_color){
    var pos_1len = array.length;
    var pos_2len = array[0].length;
    //console.log(pos_1len);
    //console.log(pos_2len);
    //console.log("pos_xyz is ", array[0][0]);
    // posを作成
    const positions = new Float32Array(pos_1len*pos_2len*3);
    for (let i = 0; i < pos_1len; i++){
        for (let j = 0; j < pos_2len; j++){
            positions[i*j*3] = array[i][j][1],
            positions[i*j*3+1] = array[i][j][2],
            positions[i*j*3+2] = array[i][j][0];
        };
    };
    const material = new THREE.PointsMaterial({
        // 1つ1つのサイズ
        size: 0.1,
        // 色
        color: point_color,
    });

    //console.log("bytes_per is", positions.BYTES_PER_ELEMENT);
    return [positions, material];
}

function table_con(){
    var table_wid = document.getElementById("table");
    console.log("table is ", table_wid);
    for(let y = 0; y < clust_1len; y++){
        const tr = table_wid.insertRow();
        for(let x = 0; x < 2; x++){
            const td = tr.insertCell();
        }
    }
    for(let y = 1; y < clust_1len; y++){
        var cell = table_wid.rows[y].cells[0];
        cell.innerHTML = y;
    }
}

function mousedownEvent(event){
    //event.preventDefault();
    //console.log("you are in the event!!!");
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(object);

    if (intersects.length > 0){
        controls.enabled = false;
        boxobj = intersects[0].object;
        boxobj.material.color.setRGB(255, 0, 0);

        if(raycaster.ray.intersectPlane(plane, intersection)){
            offset.copy(intersection).sub(boxobj.position);
        }
    }
}

function mousemoveEvent(event){
    //event.preventDefault();
    //console.log("move now !!!");

    mouse.x = (event.clientX / canv_width) * 2 - 1;
    mouse.y = -(event.clientY / canv_high) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    //boxobj.material.color.setHex(0xff0000);

    if(boxobj){
        if(raycaster.ray.intersectPlane(plane, intersection)){
            boxobj.position.copy(intersection.sub(offset));
        }
    }else{
        var intersects = raycaster.intersectObjects(object);

        if(intersects.length > 0){
            if(mouseoveredObj != intersects[0].object){
                mouseoveredObj = intersects[0].object;

                camera.getWorldDirection(plane.normal);
            }
        }else{
            mouseoveredObj = null;
        }
    }
}

function mouseupEvent(event){
    //event.preventDefault();
    controls.enabled = true;

    boxobj.material.color.setRGB(0, 255, 0);

    if (mouseoveredObj){
        boxobj = null;
    }
}

