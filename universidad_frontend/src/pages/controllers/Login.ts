import { Loading } from "@/components/Loading";
import { Lock, User } from "@element-plus/icons-vue";
import { defineComponent, markRaw, reactive } from "vue";

export default defineComponent({
  name: "Login",
  data() {
    return {
      user: markRaw(User),
      lock: markRaw(Lock),
      form: reactive({
        nombreUsuario: "",
        tipoUsuario: "",
        password: "",
      }),
    };
  },
  methods: {
    login() {
      let loading = Loading.loading("Iniciando Sesión");
      setTimeout(() => {
        loading.close();
        this.$router.push('/general/home')
      }, 2000);
    },
  },
});
