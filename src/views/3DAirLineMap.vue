<template>
  <div class="map-container">
    <div id="map-dom"></div>
  </div>
</template>

<script>
import Map from '@arcgis/core/Map';
import TileLayer from '@arcgis/core/layers/TileLayer';
import SceneView from '@arcgis/core/views/SceneView';
import * as externalRenderers from '@arcgis/core/views/3d/externalRenderers';
import AirLineRenderer from '@/utils/threejs/AirLineRenderer';

export default {
  name: 'flow-map-threejs',
  methods: {
    // 创建地图
    createSceneView() {
      const housingLayer = new TileLayer({
        url: 'http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer',
        id: 'map-test',
        opacity: 0.9,
      });

      const map = new Map();
      map.add(housingLayer);

      const view = new SceneView({
        container: 'map-dom',
        map,
        camera: {
          position: [
            106.81728807741148, 17.973344421207273, 3726356.6413883436,
          ],
          tilt: 21.902354973840445,
        },
      });
      window.view = view;

      // 坐标数据
      const coordinateData = {
        北京: [116.46, 39.92],
        成都: [104.06, 30.67],
        上海: [121.48, 31.22],
        拉萨: [91.11, 29.97],
        昆明: [102.73, 25.04],
        广州: [113.23, 23.16],
        长沙: [113, 28.21],
      };

      // 航线数据
      const airRoute = [
        ['北京', '成都'],
        ['北京', '上海'],
        ['北京', '拉萨'],
        ['北京', '昆明'],
        ['北京', '广州'],
        ['北京', '长沙'],
      ];

      const myRenderer = new AirLineRenderer({ view, coordinateData, airRoute });

      // 注册renderer
      externalRenderers.add(view, myRenderer);
    },
  },
  mounted() {
    this.createSceneView();
  },
};
</script>

<style scoped>
.map-container,
#map-dom {
  height: 100%;
  padding: 0px;
  margin: 0px;
}
</style>
