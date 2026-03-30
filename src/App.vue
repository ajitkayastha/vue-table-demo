<template>
  <div id="app" class="app-shell">
    <UsersTablePage />
  </div>
</template>

<script>
import UsersTablePage from './views/UsersTablePage.vue';

export default {
  name: 'App',
  components: {
    UsersTablePage
  }
};
</script>
