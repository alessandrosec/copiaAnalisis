<script lang="ts" src="./controllers/Login"></script>

<template>
  <el-header height="default">
    <!-- Header content -->
    <h3 class="centrar">PROYECTO UNIVERSIDAD</h3>
  </el-header>

  <el-main height="default">
    <!-- Main content -->
    <el-row :gutter="24">
      <el-col :span="12" :offset="6">
        <el-row :gutter="24">
          <h3 style="text-align: center; width: 100%;">Bienvenido/a {{ form.tipoUsuario }}</h3>
        </el-row>
        <el-row :gutter="24">
          <el-form :model="form" label-width="auto" size="large" style="width: 100%;">
            <el-form-item>
              <el-input v-model="form.nombreUsuario" placeholder="Correo de Usuario" class="input-with-select">
                <template #prepend>
                  <el-button :icon="user" />
                </template>
                <template #append>
                  <el-select v-model="form.tipoUsuario" placeholder="Perfil de Usuario" style="width: 175px">
                    <el-option label="Estudiante" value="Estudiante" />
                    <el-option label="Docente" value="Docente" />
                    <el-option label="Adminstrador" value="Administrador" />
                  </el-select>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-input v-model="form.password" type="password" placeholder="Contraseña">
                <template #prepend>
                  <el-button :icon="lock" />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <div style="text-align: center; width: 100%;">
                <el-button type="primary" @click="login">Iniciar Sesión</el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-row>
      </el-col>
    </el-row>
  </el-main>

  <el-footer height="" justify="center">
    <!-- Footer content -->
    <h5 class="centrar">Grupo #4 - Analisis de Sistemas 2 - UMG Segundo Semestre 2025</h5>
  </el-footer>
</template>

<style scoped>
.centrar {
  text-align: center;
}
</style>