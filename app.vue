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
      <ul>
        {{ allMovies.length }} {{ allMovies.length === 1 ? 'movie' : 'movies' }}
        <a href="#" @click.prevent="() => runLayout()">Run Layout</a>
        Last Layout Time: {{ lastLayoutTime }}ms
        <OSlider
          ref="slider"
          v-model="layoutOptions.numIter"
          :min="10"
          :max="5000"
          :step="10"
          variant="info"
          size="small"
        />
        <OSwitch
          v-model="layoutOptions.nodeDimensionsIncludeLabels"
          variant="info"
        />
        <OSelect v-model="layoutOptions.name">
          <option value="fcose">
            fcose
          </option>
          <option value="concentric">
            concentric
          </option>
        </OSelect>
      </ul>
    </TheDebugger>
    <TheLogo v-model:is-glitching="isGlitching" />
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
    <OLoading
      v-model:active="isLoading"
      full-page
    />
  </div>
</template>

<script setup>
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import layoutUtilities from 'cytoscape-layout-utilities';
import cxtmenu from 'cytoscape-cxtmenu';
import { MovieDb } from 'moviedb-promise';
import { OLoading, OField, OButton, OSlider, OSwitch, OSelect } from '@oruga-ui/oruga-next';

cytoscape.use(fcose);
cytoscape.use(layoutUtilities);
cytoscape.use(cxtmenu);

/** @type {cytoscape.Core} */
let cy;

const moviedb = new MovieDb('b95ecffb4e929829fbc815288785b66e');

const isLoading = ref(true);
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

const fitOrFocus = () => mode.value === 'fit'
  ? cy.fit(undefined, padding)
  : cy.fit(cy.$('node.foreground'), padding);

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
  style: [
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'background-fill': 'linear-gradient',
        'background-gradient-stop-colors': '#666 #666 #000 #000 #666 #666',
        'background-gradient-stop-positions': '0% 48% 48% 52% 52% 100%',
        'background-gradient-direction': 'to-bottom-left',
        'background-fit': 'cover',
        'background-image-crossorigin': 'anonymous',
        color: '#eee',
        'font-family': 'Roboto Mono, monospace',
        'font-size': 10,
        'min-zoomed-font-size': 8,
        'text-wrap': 'wrap',
        'text-max-width': 100,
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-justification': 'center',
        'text-margin-x': 0,
        'text-margin-y': 0,
      },
    },
    {
      selector: 'node.movie',
      style: {
        // label: 'data(title)',
        label: ele => `${
            !ele.data('poster_path') || ele.data('original_language') !== 'en'
            ? `${ele.data('title')}\n`
            : ''
          }${
            ele.data('release_date')
            ? `(${
              ele.data('release_date').split('-')[0]
            }) `
            : ''
          }${
            ele.data('vote_count') > 10
            ? `${
              Math.round(ele.data('vote_average') * 100 / 10)
            }% `
            : ''
          }${
            ele.data('runtime') ? `${ele.data('runtime')}m` : ''
          }`,
        'text-margin-y': 5,
        width: 45,
        height: 68,
        'z-index': 1,
        shape: 'round-rectangle',
        'background-image': ele => 'https://image.tmdb.org/t/p/w500' + ele.data('poster_path'),
      },
    },
    {
      selector: 'node.movie[!poster_path]',
      style: {
        'text-margin-y': 0,
        'text-valign': 'center',
        'background-fill': 'solid',
        'background-color': '#333',
        'background-image': null,
      },
    },
    {
      selector: 'node.person',
      style: {
        label: 'data(name)',
        width: 45,
        height: 45,
        'z-index': 2,
        shape: 'ellipse',
        'underlay-shape': 'ellipse',
        'background-image': ele => 'https://image.tmdb.org/t/p/w185' + ele.data('profile_path'),
        'background-offset-y': '-40%',
      },
    },
    {
      selector: 'node.person[!profile_path]',
      style: {
        'text-valign': 'center',
        'background-fill': 'solid',
        'background-color': '#333',
        'background-image': null,
      },
    },
    {
      selector: 'node.foreground',
      style: {
        'underlay-color': '#eee',
        'underlay-padding': '1px',
        'underlay-opacity': 1.0,
      },
    },
    {
      selector: 'node.background',
      style: {
        opacity: 0.9,
        'transition-property': 'opacity',
        'transition-duration': '2s',
      },
    },
    {
      selector: 'node.filtered',
      style: {
        opacity: 0.2,
        'underlay-opacity': 0,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 2,
        'line-color': '#333',
        'curve-style': 'straight',
      },
    },
    {
      selector: 'edge[billing]',
      style: {
        color: '#777',
        'font-family': 'Roboto Mono, monospace',
        'font-size': 10,
        'min-zoomed-font-size': 20,
        'target-text-offset': 20,
        'target-label': 'data(billing)',
      },
    },
  ],
};

cy = cytoscape(config);

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

  allMovies.value = cy.$('.movie').map(ele => ele.data());
};

const onPopstate = ({ state }) => {
  if (!state) { return; }
  restoreState(state);
  fitOrFocus();
};

onMounted(() => addEventListener('popstate', onPopstate));
onUnmounted(() => removeEventListener('popstate', onPopstate));

onMounted(async () => {
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

    saveState();
  }
});

fitOrFocus();
isLoading.value = false;

const openDetails = (id) => {
  if (id.startsWith('movie:') || id.startsWith('person:')) {
    window.open(`https://www.themoviedb.org/${id.replace(':', '/')}`);
  }
};

const layoutOptions = reactive({
  name: 'fcose',
  nodeDimensionsIncludeLabels: true,
  fit: false,
  randomize: false,
  quality: 'proof',
  // // Node repulsion (non overlapping) multiplier
  // nodeRepulsion: node => 4500,
  // // Ideal edge (non nested) length
  // idealEdgeLength: edge => 50,
  // // Divisor to compute edge forces
  // edgeElasticity: edge => 0.45,
  // // Nesting factor (multiplier) to compute ideal edge length for nested edges
  // nestingFactor: 0.1,
  // Maximum number of iterations to perform - this is a suggested value and might be adjusted by the algorithm as required
  numIter: 200,
  // // Gravity force (constant)
  // gravity: 0.15,
  // // Gravity range (constant)
  // gravityRange: 3.8,
  // // Initial cooling factor for incremental layout
  // initialEnergyOnIncremental: 0.3,
});

const lastLayoutTime = ref(0);

/**
   * @param {cytoscape.NodeSingular} fixedEle
   * @returns {Promise<void>}
   */
async function runLayout (fixedEle) {
  console.log({ layoutOptions });
  await new Promise((resolve) => {
    const start = Date.now();
    cy.layout({
      ...layoutOptions,
      padding,
      fixedNodeConstraint: fixedEle
        ? [{
            nodeId: fixedEle.id(),
            position: fixedEle.position(),
          }]
        : [],
      stop: () => {
        lastLayoutTime.value = Date.now() - start;
        resolve();
      },
    })
      .run();
  });
}

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
      if (credit.vote_count !== undefined) {
        include &&= credit.vote_count >= 50;
      }
      // FIXME: credits movies don't have `runtime`
      if (credit.runtime !== undefined) {
        include &&= credit.runtime >= 45;
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

  cy.add(nodesNotInGraph);

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
  if (nodesNotInGraph.length) {
    await new Promise(resolve => cy.animate({ center: { eles: ele }, complete: resolve }));

    await runLayout(ele);

    saveState();

    await new Promise(resolve => cy.animate({
      fit: { eles: mode.value === 'focus' ? neighborhood : undefined, padding },
      complete: resolve,
    }));
  }

  return {
    // This means we've run out of "pages".
    fullyExpanded: !pageOfNodes.length,
  };
}

async function fetchAndExpandNode (id, options = {}) {
  if (id.startsWith('movie:')) {
    const movie = await fetchMovie(id);
    return await expandNode(id, movie, options);
  } else if (id.startsWith('person:')) {
    const person = await fetchPerson(id);
    return await expandNode(id, person, options);
  }
}

watch(isAutoModeRunning, () => {
  if (isAutoModeRunning.value) {
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
      }

      if (isAutoModeRunning.value) {
        expandPersonNodes();
      } else {
        saveState();
      }
    }
    expandPersonNodes();
  }
});

cy
  .on('onetap', 'node', async (evt) => {
    const node = evt.target;
    const id = node.id();
    console.log('onetapped ' + id);

    try {
      isLoading.value = true;

      await fetchAndExpandNode(id);
    } finally {
      isLoading.value = false;
    }
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
          // ele.successors().remove();
          ele.remove();
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

  & .attribution {
    // There's almost certainly a better way to do this...
    position: fixed;
    right: 1rem;
    bottom: 3.5rem;
  }

  & .o-field {
    display: inline-block;
    margin-bottom: 0;
  }
}

.o-load__overlay {
  background: rgba(0, 0, 0, 0.3);
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
</style>
