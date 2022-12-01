<template>
  <OModal
    class="modal-about"
    :active="isShowing"
    @update:active="(newValue: boolean) => emit('update:isShowing', newValue)"
  >
    <h2>About</h2>
    <p>
      This site is a movie graph explorer.
      You can navigate between movies connected by their shared cast and crew members.
    </p>
    <h3>How to Use</h3>
    <ul>
      <li>Click "<OIcon title="Search" icon="movie-search-outline" size="small"></OIcon>" to choose a different movie and start exploring.</li>
      <li>Click movie posters or people to load more data and expand their connections on the graph.</li>
      <li>Double click to open more details on TMDb.</li>
      <li>Click and drag to pan the graph, scroll or pinch to zoom.</li>
      <li>Click "<OIcon title="Fit All" icon="fit-to-page-outline" size="small"></OIcon>" to fit the whole graph within the viewport.</li>
      <li>Click "<OIcon title="Focus on Highlighted" icon="image-filter-center-focus" size="small"></OIcon>" to fit only the currently highlighted nodes within the viewport.</li>
    </ul>
    <h3>Credits</h3>
    <p>
      All data and images are retrieved from
      <a target="_blank" href="https://www.themoviedb.org/"
        >The Movie Database</a
      >
      (TMDb) API.
      The default starting movie is whichever is most
      <a target="_blank" href="https://developers.themoviedb.org/3/getting-started/popularity"
        >popular</a
      >
      on TMDb at the moment.
    </p>
    <p>
      This site is
      <a target="_blank" href="https://github.com/straub/wuxia-wednesday"
        >open-sourced on GitHub</a
      >, built using
      <a target="_blank" href="https://js.cytoscape.org/"
        >Cytoscape.js</a
      > and
      <a target="_blank" href="https://nuxtjs.org/"
        >NuxtJS</a
      >, and hosted on
      <a target="_blank" href="https://www.netlify.com/"
        >Netlify</a
      >. The component library is
      <a target="_blank" href="https://oruga.io/"
        >Oruga</a
      >, and the logo glitch animation is from
      <a target="_blank" href="https://codepen.io/lbebber/pen/nqwBKK"
        >Lucas Bebber on CodePen</a
      >.
    </p>
    <p>
      The name comes from a weekly movie night game, where the object is to watch movies
      connected to each other in this way, which this site helps with slightly.
    </p>
  </OModal>
</template>

<script setup lang="ts">
import { OModal, OIcon } from '@oruga-ui/oruga-next'

defineProps({
  isShowing: Boolean,
})

const emit = defineEmits(['update:isShowing'])

</script>

<style lang="scss">
</style>