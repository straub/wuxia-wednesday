<template>
  <div
    id="container"
    @mousedown="() => isGlitching = true"
    @touchend="() => isGlitching = true"
  >
    <div
      id="cy"
      :style="{ cursor }"
      :title="title"
    />
    <TheMovieSearchModal
      v-model:is-searching="isSearching"
      @select="async (movie) => {
        if (!movie) return;
        cy.nodes().remove()
        const id = `movie:${movie.id}`;
        cy.add([{
          data: { id },
          classes: ['movie', 'foreground'],
          pannable: true,
        }])
        isSearching = false
        await fetchAndExpandNode(id);
      }"
    />
    <TheAboutModal v-model:is-showing="isShowingAbout" />
    <TheMoviesListModal
      v-model:is-showing="isShowingMoviesList"
      :movies="allMovies"
      @focus="async (id) => {
        cy.fit(cy.$id(id), padding);
      }"
      @filtered-movies="(ids) => {
        cy.batch(() => {
          cy.$('.movie').addClass('filtered');
          ids.forEach(id => cy.$id(id).removeClass('filtered'));
        });
      }"
    />
    <TheDebugger>
      <div>{{ allMovies.length }} {{ allMovies.length === 1 ? 'movie' : 'movies' }}</div>
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
import cytoscape, { use as cyUse } from 'cytoscape';
import fcose from 'cytoscape-fcose';
import layoutUtilities from 'cytoscape-layout-utilities';
import cxtmenu from 'cytoscape-cxtmenu';
import { MovieDb } from 'moviedb-promise';
import { OField, OButton, OInput, OSwitch, OSelect, ONotification } from '@oruga-ui/oruga-next';
import cyStyles from './cy-styles.ts';

cyUse(fcose);
cyUse(layoutUtilities);
cyUse(cxtmenu);

const moviedb = new MovieDb('b95ecffb4e929829fbc815288785b66e');

const loadingCount = ref(0);
const isSearching = ref(false);
const isShowingAbout = ref(false);
const isShowingMoviesList = ref(false);
const isGlitching = ref(false);
const isAutoModeRunning = ref(false);

const cursor = ref('inherit');
const title = ref('');

const mode = ref('focus');

const allMovies = shallowRef([]);

const padding = 30;

const restart = () => { window.location.href = '/'; };

const fetchMovie = async (id) => {
  id = String(id).replace('movie:', '');

  const movie = await moviedb.movieInfo({ id, append_to_response: 'credits', language: 'en-US' });
  return movie;
};

const fetchPerson = async (id) => {
  id = String(id).replace('person:', '');

  const person = await moviedb.personInfo({ id, append_to_response: 'movie_credits', language: 'en-US' });
  return person;
};

const config = {
  autoungrabify: true,
  // autolock: true,
  // autounselectify: true,
  boxSelectionEnabled: false,
  style: cyStyles,
};

const cy = cytoscape(config);

if (import.meta.hot) {
  import.meta.hot.accept('./cy-styles.ts', (newStyles) => {
    if (newStyles) {
      cy.style(newStyles.default);
    }
  });
}

const fitOrFocus = async (instant = false) => {
  if (instant) {
    cy.fit(mode.value === 'focus' ? cy.$('node.foreground') : undefined, padding);
  } else {
    await new Promise(resolve => cy.animate({
      fit: { eles: mode.value === 'focus' ? cy.$('node.foreground') : undefined, padding },
      complete: resolve,
    }));
  }
};

const saveState = () => {
  allMovies.value = cy.$('.movie').map(ele => ele.data());

  if (isAutoModeRunning.value) { return; }

  const elements = cy.elements().jsons();

  console.log('saving', { elements });

  history.pushState({ elements }, '', new URL(location));
};

const restoreState = ({ elements }) => {
  if (!elements?.length) { return; }

  cy.elements().remove();

  console.log('restoring', { elements });

  cy.add(elements);

  fitOrFocus(true);

  allMovies.value = cy.$('.movie').map(ele => ele.data());
};

const onPopstate = ({ state }) => {
  if (!state) { return; }
  restoreState(state);
};

onMounted(() => addEventListener('popstate', onPopstate));
onUnmounted(() => removeEventListener('popstate', onPopstate));

onMounted(async () => {
  loadingCount.value++;

  if (history.state?.elements?.length > 0) {
    restoreState(history.state);
  } else {
    const { results: [{ id: mostPopularId }] } = await moviedb.moviePopular();

    console.log({ mostPopularId });

    const initialMovie = await fetchMovie(mostPopularId);
    // const initialMovie = await fetchMovie(614919)
    // const initialMovie = await fetchMovie(287757)

    console.log({ initialMovie });

    const initialId = `movie:${initialMovie.id}`;

    const elements = [
      {
        group: 'nodes',
        data: { ...initialMovie, id: initialId },
        classes: ['movie', 'foreground'],
        pannable: true,
      },
    ];

    cy.add(elements);

    await fetchAndExpandNode(initialId);
  }

  loadingCount.value--;
});

const openDetails = (id) => {
  if (id.startsWith('movie:') || id.startsWith('person:')) {
    window.open(`https://www.themoviedb.org/${id.replace(':', '/')}`);
  }
};

const layoutOptions = reactive({
  name: 'fcose',
  nodeDimensionsIncludeLabels: true,
  // Whether or not simple nodes (non-compound nodes) are of uniform dimensions
  // uniformNodeDimensions: false,
  quality: 'proof',
  // // Whether or not to animate the layout
  // animate: true,
  // // Duration of animation in ms, if enabled
  animationDuration: 700,
  // // Easing of animation, if enabled
  // animationEasing: undefined,
  // Node repulsion (non overlapping) multiplier
  // nodeRepulsion: node => 4500,
  nodeRepulsion: 4500,
  // Ideal edge (non nested) length
  // idealEdgeLength: edge => 50,
  idealEdgeLength: 100,
  // Divisor to compute edge forces
  // edgeElasticity: edge => 0.45,
  edgeElasticity: 0.1,
  // // Maximum number of iterations to perform - this is a suggested value and might be adjusted by the algorithm as required
  // numIter: 2500,
  // Gravity force (constant)
  gravity: 0.15,
  // Gravity range (constant)
  // gravityRange: 3.8,
  gravityRange: 1,
  // Initial cooling factor for incremental layout
  // initialEnergyOnIncremental: 0.3,
  initialEnergyOnIncremental: 0.075,
});

const lastLayoutTime = ref(0);

/**
   * @param {cytoscape.NodeSingular} fixedEle
   * @returns {Promise<void>}
   */
async function runLayout (fixedEle) {
  // console.log({ layoutOptions });
  await new Promise((resolve) => {
    const start = Date.now();
    cy.layout({
      fit: false,
      randomize: false,
      ...layoutOptions,
      ...(cy.$('.movie').length === 1
        ? {
            // Give the layout enough juice when there's only one movie in the
            // graph that it doesn't just make a line of the person nodes.
            initialEnergyOnIncremental: 0.6,
          }
        : {}),
      padding,
      fixedNodeConstraint: [
        {
          nodeId: cy.nodes().first().id(),
          position: { x: 0, y: 0 },
        },
        ...(fixedEle
          ? [{
              nodeId: fixedEle.id(),
              position: fixedEle.position(),
            }]
          : []),
      ],
      ready: () => (lastLayoutTime.value = Date.now() - start),
      stop: resolve,
    })
      .run();
  });
}

const isContinuousLayoutRunning = ref(false);

watch(isContinuousLayoutRunning, () => {
  if (isContinuousLayoutRunning.value) {
    async function runContinuousLayout () {
      await runLayout();

      // Let the browser breathe for as long as the last layout took.
      await new Promise(resolve => setTimeout(resolve, lastLayoutTime.value));

      if (isContinuousLayoutRunning.value) {
        requestAnimationFrame(runContinuousLayout);
      }
    }
    runContinuousLayout();
  }
}, { immediate: true });

onUnmounted(() => (isContinuousLayoutRunning.value = false));

/**
   * @param {string} id
   * @param {Object} [newData]
   * @param {Object} [options]
   */
async function expandNode (id, newData = {}, { all = false } = {}) {
  const type = id.split(':')[0];
  const otherType = type === 'movie' ? 'person' : 'movie';
  const ele = cy.$id(id);
  ele.data(newData);
  console.log({ id, type, newData, ele });

  const currentPage = ele.data('currentPage') ?? 0;
  ele.data('currentPage', currentPage + 1);

  const credits = [
    ...(newData.credits ?? newData.movie_credits).cast,
    // ...(newData.credits ?? newData.movie_credits).crew,
  ];

  const perPage = 10;

  const pageOfNodes = credits
    // There's a lot of noise in "movie" credits, so we filter some out now to
    // improve usability of the graph and movies list.
    .filter((credit) => {
      let include = true;
      if (credits.length <= 10 && credit.vote_count !== undefined) {
        include &&= credit.vote_count >= 10;
      }
      return include;
    })
    .sort((a, b) => b.popularity - a.popularity)
    .slice(all ? 0 : currentPage * perPage, all ? undefined : (currentPage + 1) * perPage)
    .map((credit) => {
      return [
        {
          group: 'nodes',
          data: { ...credit, id: `${otherType}:${credit.id}` },
          classes: [otherType],
          position: { ...ele.position() },
          pannable: true,
        },
      ];
    })
    .flat();

  const nodesNotInGraph = pageOfNodes
    .filter(node => !cy.hasElementWithId(node.data.id));

  if (type === 'person') {
    // Fetch additional data on new movies
    await Promise.all(
      nodesNotInGraph.map(async (node) => {
        const movie = await fetchMovie(node.data.id.replace('movie:', ''));

        node.data = {
          ...movie,
          ...node.data,
        };
      }),
    );
  }

  const nodesNotInGraphFilteredForRuntime = nodesNotInGraph
    .filter((node) => {
      let include = true;
      if (node.data.runtime !== undefined) {
        include &&= node.data.runtime >= 45;
      }
      return include;
    });

  const elesAdded = cy.add(nodesNotInGraphFilteredForRuntime);

  // Even if a node was already in the graph, there may be new edges we can add now.
  const allValidEdges = credits
    .map((credit) => {
      const movie = type === 'movie' ? newData : credit;
      const person = type === 'person' ? newData : credit;

      return [
        {
          group: 'edges',
          data: {
            id: `movie:${movie.id}-person:${person.id}`,
            source: `movie:${movie.id}`,
            target: `person:${person.id}`,
            billing: !isNaN(credit.order) ? `#${credit.order + 1}` : credit.job,
          },
        },
      ];
    })
    .flat()
    .filter(edge => cy.hasElementWithId(edge.data.source) && cy.hasElementWithId(edge.data.target));

  cy.add(allValidEdges);

  // Highlight neighborhood of expanded node
  cy.nodes().addClass('background').removeClass('foreground');
  const neighborhood = ele.closedNeighborhood();
  neighborhood.removeClass('background').addClass('foreground');

  // Only animate and layout if we added new nodes
  if (elesAdded.length) {
    await new Promise(resolve => cy.animate({ center: { eles: ele }, complete: resolve }));

    if (!isContinuousLayoutRunning.value) {
      await runLayout(ele);

      cy.one('layoutstop', () => saveState());

      await fitOrFocus();
    }
  }

  return {
    // This means we've run out of "pages".
    fullyExpanded: !pageOfNodes.length,
  };
}

async function fetchAndExpandNode (id, options = {}) {
  try {
    loadingCount.value++;

    if (id.startsWith('movie:')) {
      const movie = await fetchMovie(id);
      return await expandNode(id, movie, options);
    } else if (id.startsWith('person:')) {
      const person = await fetchPerson(id);
      return await expandNode(id, person, options);
    }
  } finally {
    loadingCount.value--;
  }
}

const isAutoModeComplete = ref(false);
const lastAutoModeTime = ref(0);

watch(isAutoModeRunning, () => {
  if (isAutoModeRunning.value) {
    isAutoModeComplete.value = false;
    isContinuousLayoutRunning.value = true;
    const autoModeStartTime = Date.now();

    async function expandPersonNodes () {
      let allFullyExpanded = true;

      for (const node of cy.$('.person')) {
        if (!isAutoModeRunning.value) { break; }

        const id = node.id();

        const { fullyExpanded } = await fetchAndExpandNode(id);

        allFullyExpanded &&= fullyExpanded;
      }

      if (allFullyExpanded) {
        isAutoModeRunning.value = false;
        cy.animate({
          fit: { eles: undefined, padding },
        });
        isAutoModeComplete.value = true;
      }

      if (isAutoModeRunning.value) {
        expandPersonNodes();
      } else {
        isContinuousLayoutRunning.value = false;
        lastAutoModeTime.value = Date.now() - autoModeStartTime;
        saveState();
      }
    }
    expandPersonNodes();
  }
});

onUnmounted(() => (isAutoModeRunning.value = false));

cy
  .on('onetap', 'node', async (evt) => {
    const node = evt.target;
    const id = node.id();
    console.log('onetapped ' + id);

    await fetchAndExpandNode(id);
  })
  .on('dbltap', 'node', (evt) => {
    const node = evt.target;
    const id = node.id();
    console.log('dbltapped ' + id);

    openDetails(id);
  })
  .on('mouseover', 'node', (evt) => {
    const node = evt.target;
    cursor.value = 'pointer';
    title.value = node.data('title') ?? node.data('name') ?? '';
  })
  .on('mouseout', 'node', () => {
    cursor.value = 'inherit';
    title.value = '';
  });

onMounted(() => cy.mount(document.getElementById('cy')));

onMounted(() => {
  cy.cxtmenu({
    commands: [
      {
        content: 'Details',
        select: function (ele) {
          const id = ele.id();
          console.log('selected for details', id);
          openDetails(id);
        },
      },
      {
        content: 'Prune',
        select: function (ele) {
          const id = ele.id();
          console.log('selected for prune', id);
          ele.remove();
          // Remove all nodes now unreachable from the origin.
          const dijkstra = cy.elements().dijkstra(cy.nodes().first());
          cy.nodes().filter(node => dijkstra.distanceTo(node) === Infinity).remove();
          saveState();
        },
      },
      {
        content: 'Expand All',
        select: function (ele) {
          const id = ele.id();
          console.log('selected for expand all', id);
          fetchAndExpandNode(id, { all: true });
        },
      },
    ],
  });
});
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
@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400&display=swap');

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
