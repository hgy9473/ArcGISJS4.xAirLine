import * as externalRenderers from '@arcgis/core/views/3d/externalRenderers';
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils';
import * as THREE from 'three';
import AirLine from './AirLine';

class AirLineRenderer {
    view = null;

    renderer = null; // three.js 渲染器

    camera = null; // three.js 相机

    scene = null; // three.js 中的场景

    lines = [];

    airRoute = [];

    coordinateData = [];

    constructor(options) {
      this.view = options.view;
      this.airRoute = options.airRoute;
      this.coordinateData = options.coordinateData;
    }

    setup(context) {
      this.renderer = new THREE.WebGLRenderer({
        context: context.gl, // 可用于将渲染器附加到已有的渲染环境(RenderingContext)中
        premultipliedAlpha: false, // renderer是否假设颜色有 premultiplied alpha. 默认为true
      });
      this.renderer.setPixelRatio(window.devicePixelRatio); // 设置设备像素比。通常用于避免HiDPI设备上绘图模糊
      this.renderer.setViewport(0, 0, this.view.width, this.view.height); // 视口大小设置

      // 防止Three.js清除ArcGIS JS API提供的缓冲区。
      this.renderer.autoClearDepth = false; // 定义renderer是否清除深度缓存
      this.renderer.autoClearStencil = false; // 定义renderer是否清除模板缓存
      this.renderer.autoClearColor = false; // 定义renderer是否清除颜色缓存

      // ArcGIS JS API渲染自定义离屏缓冲区，而不是默认的帧缓冲区。
      // 我们必须将这段代码注入到three.js运行时中，以便绑定这些缓冲区而不是默认的缓冲区。
      const originalSetRenderTarget = this.renderer.setRenderTarget.bind(
        this.renderer,
      );
      this.renderer.setRenderTarget = (target) => {
        originalSetRenderTarget(target);
        if (target == null) {
          // 绑定外部渲染器应该渲染到的颜色和深度缓冲区
          context.bindRenderTarget();
        }
      };

      this.scene = new THREE.Scene(); // 场景
      this.camera = new THREE.PerspectiveCamera(); // 相机

      // 添加坐标轴辅助工具
      const axesHelper = new THREE.AxesHelper(10000000);
      this.scene.add(axesHelper);

      // 更新view的resolution
      this.scene.userData.viewResolution = this.view.resolution;

      // 航线数据
      this.airRoute.forEach((route) => {
        const startCoordinate = this.coordinateData[route[0]]; // 起点坐标
        const endCoordinate = this.coordinateData[route[1]]; // 终点坐标
        // 中间点坐标
        const centerCoordinate = [
          startCoordinate[0] + (endCoordinate[0] - startCoordinate[0]) / 2,
          startCoordinate[1] + (endCoordinate[1] - startCoordinate[1]) / 2,
        ];

        // 转换后的起点坐标
        const startPoint = this.pointTransform(
          startCoordinate[0],
          startCoordinate[1],
          100,
        );
        // 转换后的终点坐标
        const endPoint = this.pointTransform(
          endCoordinate[0],
          endCoordinate[1],
          100,
        );
        // 转换后的中间点坐标
        const centerPoint = this.pointTransform(
          centerCoordinate[0],
          centerCoordinate[1],
          200000,
        );

        const line = new AirLine(
          this.scene,
          startPoint,
          endPoint,
          centerPoint,
        );
        this.lines.push(line);
      });
      context.resetWebGLState();
    }

    render(context) {
      // 更新相机参数
      const cam = context.camera;
      this.camera.position.set(cam.eye[0], cam.eye[1], cam.eye[2]);
      this.camera.up.set(cam.up[0], cam.up[1], cam.up[2]);
      this.camera.lookAt(
        new THREE.Vector3(cam.center[0], cam.center[1], cam.center[2]),
      );
      // 投影矩阵可以直接复制
      this.camera.projectionMatrix.fromArray(cam.projectionMatrix);
      // 更新lines
      this.lines.forEach((line) => {
        line.update();
      });
      // 更新view的resolution
      this.scene.userData.viewResolution = this.view.resolution;
      // 绘制场景
      this.renderer.state.reset();
      this.renderer.render(this.scene, this.camera);
      // 请求重绘视图。
      externalRenderers.requestRender(this.view);
      // cleanup
      context.resetWebGLState();
    }

    /**
     * 经纬度坐标点转换为渲染坐标系中的点坐标
     * @param {number} longitude 经度
     * @param {number} latitude 纬度
     * @param {number} height 高度
     */
    pointTransform(longitude, latitude, height) {
      const transform = new THREE.Matrix4(); // 变换矩阵
      const transformation = new Array(16);
      // 将经纬度坐标转换为xy值
      const pointXY = webMercatorUtils.lngLatToXY(longitude, latitude);
      // 先转换高度为0的点
      transform.fromArray(
        externalRenderers.renderCoordinateTransformAt(
          this.view,
          [pointXY[0], pointXY[1], height], // 坐标在地面上的点[x值, y值, 高度值]
          this.view.spatialReference,
          transformation,
        ),
      );
      return [
        transform.elements[12],
        transform.elements[13],
        transform.elements[14],
      ];
    }
}

export default AirLineRenderer;
