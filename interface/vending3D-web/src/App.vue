<template>
  <div class="app">
    <Content/>
    <Sidebar/>
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
  width: 100%;
 
}

.app {
  display: flex;
  justify-content: center; 
  align-items: center;
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border: solid 1px black;
}



</style>
