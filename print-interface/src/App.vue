<template>
  <div class="row" style="height: 100%; overflow: hidden;">
    <Sidebar class="no-flex" style="width: 350px; z-index: 2;"/>
    <Content class="flex"/>
  </div>
</template>

<script>
import Content from './pages/Content'
import Sidebar from './pages/Sidebar'

export default {
  name: 'App',
  components: {
    Content,
    Sidebar
  }
}
</script>

<style>
body {
  font-family: Ubuntu, Helvetica Neue,Helvetica,PingFang SC,Hiragino Sans GB,Microsoft YaHei,SimSun,sans-serif;
  overflow: auto;
  font-weight: 400;
  padding: 0;
  margin: 0;
  height: 100%;
}
html {
  overflow-y: initial;
}

html, body {
  height: 100%;
  min-height: 100%;
  position: relative;
  widows: 100%;
}

/* 
  Webkit Scrollbar 
*/
*::-webkit-scrollbar {
  width: 6px !important;
  height: 6px !important;
  overflow: hidden;
  background: transparent;
}

.native.win32 *::-webkit-scrollbar {
  width: 8px !important;
  height: 8px !important;
}

*::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.2)
}

*::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.08)
}


</style>
