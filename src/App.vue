<template>
  <div class="app-shell">
    <Toolbar />
    <div class="workspace">
      <aside class="left-panel">
        <div class="left-top">
          <PageTree />
        </div>
        <div class="left-bottom">
          <ComponentPalette />
        </div>
      </aside>
      <DesignCanvas />
      <PropertyPanel />
    </div>
  </div>
</template>

<script setup>
import Toolbar from '@/components/Toolbar.vue'
import PageTree from '@/components/PageTree.vue'
import ComponentPalette from '@/components/ComponentPalette.vue'
import DesignCanvas from '@/components/DesignCanvas.vue'
import PropertyPanel from '@/components/PropertyPanel.vue'
</script>

<style scoped>
.app-shell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.workspace {
  flex: 1;
  min-height: 0;
  display: flex;
}
.left-panel {
  width: var(--sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  background: var(--panel-bg);
  min-height: 0;
}
.left-top {
  flex: 1;
  min-height: 42px;
  max-height: 45%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.left-top:has(.collapsed), .left-bottom:has(.collapsed) { flex: 0 0 auto; }
.left-top:has(.collapsed) { max-height: none; }
.left-bottom {
  flex: 1;
  min-height: 42px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
