<template>
  <div id="app" class="app-shell">
    <UsersTablePage
      :is-dark-theme="isDarkTheme"
      @toggle-theme="toggleTheme" />
  </div>
</template>

<script>
import UsersTablePage from './views/UsersTablePage.vue';

export default {
  name: 'App',
  components: {
    UsersTablePage
  },
  data: function data() {
    return {
      theme: 'light'
    };
  },
  computed: {
    isDarkTheme: function isDarkTheme() {
      return this.theme === 'dark';
    }
  },
  created: function created() {
    var storedTheme = this.getStoredTheme();

    if (storedTheme) {
      this.theme = storedTheme;
    } else if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      this.theme = 'dark';
    }

    this.applyTheme();
  },
  methods: {
    toggleTheme: function toggleTheme() {
      this.theme = this.isDarkTheme ? 'light' : 'dark';
      this.applyTheme();

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('app-theme', this.theme);
      }
    },
    applyTheme: function applyTheme() {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', this.theme);
      }
    },
    getStoredTheme: function getStoredTheme() {
      if (typeof window === 'undefined') {
        return '';
      }

      var value = window.localStorage.getItem('app-theme');
      return value === 'light' || value === 'dark' ? value : '';
    }
  }
};
</script>
