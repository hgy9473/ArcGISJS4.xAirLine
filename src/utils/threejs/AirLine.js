import * as THREE from 'three';

// 颜色
const colors = ['#ffff00', '#00ffe2', '#9800ff', '#ff6767'];

class AirLine {
    scene = null; // 场景

    color = null; // 颜色

    startPoint = null; // 起点坐标

    endPoint = null; // 终点坐标

    centerPoint = null; // 中间点

    divisions = 60; // 曲线的分段数量

    line = null;

    highLight = null; // 光线最亮的那一部分

    circle = null; // 终点的圆

    colorIndex = 0; // 高亮颜色流动的索引值

    timestamp = 0; // 时间戳

    /** *
     * 构造函数
     * @param scene
     * @param startPoint 航线起点
     * @param endPoint 航线终点
     * @param centerPoint 航线中心点
     */
    constructor(scene, startPoint, endPoint, centerPoint) {
      this.scene = scene;
      // 随机获取颜色
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.startPoint = startPoint;
      this.endPoint = endPoint;
      this.centerPoint = centerPoint;
      this.createLine();
      this.createCircle();
    }

    /** ***************
     * 用三个点创建一条平滑的三维曲线
     * 1、生成样条曲线
     * 2、提取样条曲线上的点绘制曲线
     * 3、绘制曲线高亮段
     */
    createLine() {
      // 生成样条曲线
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(
          this.startPoint[0],
          this.startPoint[1],
          this.startPoint[2],
        ),
        new THREE.Vector3(
          this.centerPoint[0],
          this.centerPoint[1],
          this.centerPoint[2],
        ),
        new THREE.Vector3(
          this.endPoint[0],
          this.endPoint[1],
          this.endPoint[2],
        ),
      ]);
        // 获取曲线上的点
      const points = curve.getPoints(this.divisions); // 返回 分段数量 + 1 个点，例如这里的points.length就为31

      /** *******************
         * 创建线
         * 线由顶点、材质构成
         *********************
         */
      // 生成曲线几何点
      const geometry = new THREE.Geometry();
      geometry.vertices = points;
      geometry.verticesNeedUpdate = true; // 如果顶点队列中的数据被修改，该值需要被设置为 true

      // 设置顶点 colors 数组，与顶点数量和顺序保持一致。
      geometry.colors = new Array(points.length).fill(
        new THREE.Color('#ffff00'),
      );

      // 生成材质
      const material = new THREE.LineBasicMaterial({
        vertexColors: THREE.VertexColors, // 顶点着色
        transparent: true, // 定义此材质是否透明
        side: THREE.DoubleSide,
        opacity: 0.6,
      });
      this.line = new THREE.Line(geometry, material);

      /** ******************
         * 绘制高亮线
         * 一条高亮线由三个点构成
         */
      const highLightGeometry = new THREE.Geometry();
      highLightGeometry.vertices = points.slice(
        this.colorIndex,
        this.colorIndex + 3,
      );
      highLightGeometry.verticesNeedUpdate = true; // 如果顶点队列中的数据被修改，该值需要被设置为 true
      highLightGeometry.colors = [
        new THREE.Color(this.color),
        new THREE.Color('#ffffff'),
        new THREE.Color(this.color),
      ];
      const highLightMaterial = material.clone();
      highLightMaterial.opacity = 1;
      this.highLight = new THREE.Line(highLightGeometry, highLightMaterial);

      this.scene.add(this.line);
      this.scene.add(this.highLight);
    }

    createCircle() {
      const radius = this.scene.userData.viewResolution * 30;
      // 生成圆环
      const circleGeometry = new THREE.CircleGeometry(radius, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.color),
        side: THREE.DoubleSide,
        transparent: true, // 定义此材质是否透明
        opacity: 1,
      });
      const circleMesh = new THREE.Mesh(circleGeometry, ringMaterial);
      // 设置终点圆圈的位置
      circleMesh.position.set(
        this.endPoint[0],
        this.endPoint[1],
        this.endPoint[2],
      );
      // 计算调整姿态的角度
      let deltaX = Math.atan(this.endPoint[2] / this.endPoint[1]);
      let deltaZ = Math.atan(
        this.endPoint[0]
            / Math.sqrt(
              this.endPoint[1] * this.endPoint[1]
                + this.endPoint[2] * this.endPoint[2],
            ),
      );
        // 如果 y < 0 需要加上180°
      if (this.endPoint[1] < 0) {
        deltaX += Math.PI;
      } else {
        deltaZ *= -1;
      }
      // 调整圆圈姿态
      circleMesh.rotation.x = deltaX;
      circleMesh.rotation.z = deltaZ;
      circleMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2); // 再沿X轴旋转90°
      circleMesh.visible = false;
      this.circle = circleMesh;
      this.scene.add(circleMesh);
    }

    update() {
      // 时间间隔
      const now = new Date().getTime();
      if (now - this.timestamp > 30) {
        this.highLight.geometry.vertices = this.line.geometry.vertices.slice(
          this.colorIndex,
          this.colorIndex + 3,
        );
        // 如果geometry.vertices数据发生变化，verticesNeedUpdate值需要被设置为true
        this.highLight.geometry.verticesNeedUpdate = true;

        // 根据过程时机设置圆圈的透明度和缩放比例
        const ratio = this.colorIndex / this.line.geometry.vertices.length;
        this.circle.material.opacity = 1 - ratio * 2;
        this.circle.scale.set(ratio * 2, ratio * 2, ratio * 2);
        if (ratio >= 0.5) {
          this.circle.visible = false;
        }

        this.timestamp = now;
        this.colorIndex++;
        if (this.colorIndex > this.divisions - 3) {
          this.circle.visible = true;
          this.colorIndex = 0;
        }
      }
    }
}

export default AirLine;
