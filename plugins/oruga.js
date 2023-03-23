
import { Config } from '@oruga-ui/oruga-next';
import OrugaSvgIcon from '../components/OrugaSvgIcon';

export default defineNuxtPlugin(nuxtApp =>
  nuxtApp.vueApp
    .component('oruga-svg-icon', OrugaSvgIcon)
    .use(Config, {
      iconComponent: 'oruga-svg-icon',
      iconPack: 'mdi',
    }),
);
