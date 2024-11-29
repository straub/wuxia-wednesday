<template>
  <div
    id="container"
    @mousedown="() => isGlitching = true"
    @touchend="() => isGlitching = true"
  >
    <NuxtPwaManifest />
    <ClientOnly>
      <TheCytoscape
        ref="cy"
        :mode="mode"
        v-model:isAutoModeRunning="isAutoModeRunning"
        v-model:isAutoModeComplete="isAutoModeComplete"
        v-model:isContinuousLayoutRunning="isContinuousLayoutRunning"
      />
      <TheMoviesListModal
        v-model:is-showing="isShowingMoviesList"
        :movies="allMovies"
        :people="allPeople"
        @focus="cy.focusId($event)"
        @filtered-movies="cy.onFilteredMovies($event)"
      />
      <TheDebugger>
        <div>
          {{ allMovies.length }} {{ allMovies.length === 1 ? 'movie' : 'movies' }},
          {{ allPeople.length }} {{ allPeople.length === 1 ? 'person' : 'people' }}
        </div>
        <div><a href="#" @click.prevent="() => runLayout()">Run Layout</a></div>
        <div>Last Layout Time: {{ lastLayoutTime }}ms</div>
        <OField label="Continuous Layout">
          <OSwitch
            v-model="isContinuousLayoutRunning"
            variant="info"
          />
        </OField>
        <OField
          v-for="key in Object.keys(layoutOptions)"
          :key="key"
          :label="key"
        >
          <OInput
            v-if="(typeof layoutOptions[key]) === 'number'"
            type="number"
            step="any"
            variant="info"
            size="small"
            :model-value="layoutOptions[key]"
            @update:model-value="(value) => layoutOptions[key] = Number(value)"
          />
          <OSwitch
            v-else-if="(typeof layoutOptions[key]) === 'boolean'"
            v-model="layoutOptions[key]"
            variant="info"
          />
          <OSelect
            v-else-if="key === 'name'"
            v-model="layoutOptions[key]"
          >
            <option
              v-for="value in ['fcose','concentric']"
              :key="value"
              :value="value"
              v-text="value"
            />
          </OSelect>
          <OSelect
            v-else-if="key === 'quality'"
            v-model="layoutOptions[key]"
          >
            <option
              v-for="value in ['draft','default','proof']"
              :key="value"
              :value="value"
              v-text="value"
            />
          </OSelect>
        </OField>
      </TheDebugger>
    </ClientOnly>
    <TheMovieSearchModal
      v-model:is-searching="isSearching"
      @select="isSearching = false; cy.selectMovie($event)"
    />
    <TheAboutModal v-model:is-showing="isShowingAbout" />
    <TheLogo
      v-model:is-glitching="isGlitching"
      :is-loading="loadingCount > 0"
    />
    <div id="toolbar">
      <div class="attribution">
        Data from&nbsp;<a
          target="_blank"
          href="https://www.themoviedb.org/"
        ><img
          title="The Movie Database"
          src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
        >
        </a>
      </div>
      <OField>
        <OButton
          size="small"
          :title="mode === 'fit' ? 'Focus on Highlighted' : 'Fit All'"
          :icon-right="mode === 'fit' ? 'image-filter-center-focus' : 'fit-to-page-outline'"
          @click="mode = mode === 'fit' ? 'focus' : 'fit'; fitOrFocus()"
        />
        <OButton
          size="small"
          title="Search"
          icon-right="movie-search-outline"
          @click="isSearching = true"
        />
        <OButton
          size="small"
          title="Movies List"
          icon-right="table"
          @click="isShowingMoviesList = true"
        />
        <OButton
          size="small"
          title="Auto Mode"
          icon-right="auto-mode"
          :class="{ isAutoModeRunning }"
          @click="isAutoModeRunning = !isAutoModeRunning"
        />
        <OButton
          size="small"
          title="About"
          icon-right="information-outline"
          @click="isShowingAbout = true"
        />
        <OButton
          size="small"
          title="Restart"
          icon-right="restart"
          @click="restart()"
        />
        <!-- <OButton @click="" size="small" title="Settings" icon-right="cog-outline"></OButton> -->
      </OField>
    </div>
    <ONotification
      v-model:active="isAutoModeComplete"
      variant="info"
      position="top"
      has-icon
      icon="auto-mode"
      icon-size="small"
      closable
      indefinite
    >
      Auto Mode is complete!
      Found {{ allMovies.length }} movies in {{ (lastAutoModeTime / 1000 / 60).toFixed(1) }} minutes.
    </ONotification>
  </div>
</template>

<script setup>
import { OField, OButton, OInput, OSwitch, OSelect, ONotification } from '@oruga-ui/oruga-next';

const isSearching = ref(false);
const isShowingAbout = ref(false);
const isShowingMoviesList = ref(false);
const isGlitching = ref(false);
const isAutoModeRunning = ref(false);
const isAutoModeComplete = ref(false);
const isContinuousLayoutRunning = ref(false);

const mode = ref('focus');

const restart = () => { window.location.href = '/'; };

const cy = useTemplateRef('cy');

const lastAutoModeTime = computed(() => cy.value?.lastAutoModeTime);
const lastLayoutTime = computed(() => cy.value?.lastLayoutTime);
const layoutOptions = computed(() => cy.value?.layoutOptions ?? {});
const runLayout = () => cy.value.runLayout();

const allMovies = computed(() => cy.value?.allMovies ?? []);
const allPeople = computed(() => cy.value?.allPeople ?? []);

const loadingCount = computed(() => cy.value?.loadingCount);
</script>

<style lang="scss">
@use '@oruga-ui/oruga-next/src/scss/oruga-full-vars.scss' with (
  $white: #000,
  $black: #fff,
  $field-label-color: #fff,
  $button-color: #fff,
  $button-background-color: #444,
  $button-border: 1px solid #111,
  $modal-close-color: #fff,
  $autocomplete-menu-background: #000,
  $autocomplete-item-color: #fff,
  $autocomplete-item-hover-color: #fff,
  $autocomplete-item-hover-background-color: #333,
  $icon-spin-duration: 0.5s,
  $table-background-color: #000,
  $table-color: #fff,
  $table-th-color: #bbb,
  $table-detail-chevron-color: #bbb,
  $sidebar-content-background-color: #111,
);

html,
body {
  margin: 0px;
  height: 100%;

  background-color: #000;
  text-shadow: #888 0 0 1rem;
  color: #fff;
  font-family: 'Roboto Mono', monospace;
}

:link {
  color: #01b4e4;
}

:visited {
  color: #90cea1;
}

#container, #cy {
  height: 100vh;
}

.o-modal__content {
  width: 50vw;
  padding: 2rem;
}

#toolbar {
  position: fixed;
  bottom: 1.5rem;
  right: 1rem;

  .attribution {
    // There's almost certainly a better way to do this...
    position: fixed;
    right: 1rem;
    bottom: 3.5rem;
  }

  .o-field {
    display: inline-block;
    margin-bottom: 0;
  }
}

.isAutoModeRunning svg {
  animation: isAutoModeRunning 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
}
@keyframes isAutoModeRunning {
  from {
    transform: rotate(0turn);
  }

  to {
    transform: rotate(1turn);
  }
}
.o-icon {
  vertical-align: bottom;
}
.o-notification--top {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translate(-50%);
}
</style>
