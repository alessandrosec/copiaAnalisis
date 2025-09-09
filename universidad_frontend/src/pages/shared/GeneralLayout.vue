<script lang="ts" src="./controllers/GeneralLayout"></script>

<template>
  <el-container class="layout-container" style="height: 500px">
    <el-aside width="200px">
      <el-scrollbar>
        <el-menu :default-openeds="['1']">
          <el-sub-menu index="1" class="principal">
            <template #title>
              <el-icon>
                <Menu />
              </el-icon>Seguridad
            </template>
            <el-menu-item-group>
              <el-menu-item index="1-1"><el-icon>
                  <DArrowRight />
                </el-icon>Roles</el-menu-item>
              <el-menu-item index="1-2"><el-icon>
                  <DArrowRight />
                </el-icon>Accesos</el-menu-item>
            </el-menu-item-group>
            <el-sub-menu index="1-3">
              <template #title><el-icon>
                  <Menu />
                </el-icon>Administracion</template>
              <el-menu-item index="1-3-1"><el-icon>
                  <DArrowRight />
                </el-icon>Estudiantes</el-menu-item>
              <el-menu-item index="1-3-2"><el-icon>
                  <DArrowRight />
                </el-icon>Docentes</el-menu-item>
            </el-sub-menu>
          </el-sub-menu>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header style="text-align: right; font-size: 12px">
        <div class="toolbar">
          <el-dropdown>
            <el-icon style="margin-right: 8px; margin-top: 1px">
              <User />
            </el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>Perfil de Usuario</el-dropdown-item>
                <el-dropdown-item>Cambiar Contraseña</el-dropdown-item>
                <el-dropdown-item @click="logout">Cerrar Sesión</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span>Nombre Usuario</span>
        </div>
      </el-header>

      <el-main>
        <el-scrollbar>
          <router-view></router-view>
        </el-scrollbar>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh !important;
}

.layout-container .el-header {
  position: relative;
  background-color: var(--el-color-primary-light-7);
  color: var(--el-text-color-primary);
}

.layout-container .el-aside {
  color: var(--el-text-color-primary);
  background: var(--el-color-primary-light-8);
}

.layout-container .el-menu {
  border-right: none;
}

.layout-container .el-main {
  padding: 0;
}

.layout-container .toolbar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  right: 20px;
}

.el-header {
  height: 56px;
}

.principal {
  background-color: deepskyblue;
}
</style>