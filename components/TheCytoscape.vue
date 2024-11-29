<template>
  <div
    id="cy"
    :style="{ cursor }"
    :title="title"
  />
</template>

<script setup>
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import layoutUtilities from 'cytoscape-layout-utilities';
import cxtmenu from 'cytoscape-cxtmenu';
import { MovieDb } from 'moviedb-promise';
import cyStyles from './cy-styles.ts';

cytoscape.use(fcose);
cytoscape.use(layoutUtilities);
cytoscape.use(cxtmenu);

const props = defineProps({
  mode: String,
});

const emit = defineEmits([
  'update:isAutoModeRunning',
  'update:isAutoModeComplete',
  'update:isContinuousLayoutRunning',
]);

const isAutoModeRunning = defineModel('isAutoModeRunning');
const isAutoModeComplete = defineModel('isAutoModeComplete');
const isContinuousLayoutRunning = defineModel('isContinuousLayoutRunning');

const mode = computed(() => props.mode);

const loadingCount = ref(0);
const lastAutoModeTime = ref(0);

const cursor = ref('inherit');
const title = ref('');

const allMovies = shallowRef([]);
const allPeople = shallowRef([]);

const padding = 30;

const moviedb = new MovieDb('b95ecffb4e929829fbc815288785b66e');

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
  allPeople.value = cy.$('.person').map(ele => ele.data());

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
  allPeople.value = cy.$('.person').map(ele => ele.data());
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

onUnmounted(() => emit('update:isContinuousLayoutRunning', false));

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

  const totalPages = Math.ceil(credits.length / perPage);
  const percentExpanded = Math.min(100, Math.round((currentPage + 1) / totalPages * 100));

  ele.data({ percentExpanded });
  ele.style({ 'pie-1-background-opacity': 1 });
  ele.animate({ style: { 'pie-1-background-opacity': 0 }, duration: 3000, });

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
  } else if (type === 'movie') {
    // Fetch additional data on new people
    await Promise.all(
      nodesNotInGraph.map(async (node) => {
        const person = await fetchPerson(node.data.id.replace('person:', ''));

        node.data = {
          ...person,
          ...node.data,
        };
      }),
    );
  }

  const nodesNotInGraphFilteredForExtraProps = nodesNotInGraph
    .filter((node) => {
      let include = true;
      if (node.data.runtime !== undefined) {
        include &&= node.data.runtime >= 45;
        include &&= node.data.runtime <= 240;
      }
      if (node.data.movie_credits?.cast !== undefined) {
        include &&= node.data.movie_credits?.cast.length > 1;
      }
      return include;
    });

  const elesAdded = cy.add(nodesNotInGraphFilteredForExtraProps);

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

      saveState();

      await fitOrFocus();
    } else {
      cy.one('layoutstop', () => saveState());
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

let wakeLock;

watch(isAutoModeRunning, async () => {
  if (isAutoModeRunning.value) {
    // isAutoModeComplete.value = false;
    emit('update:isAutoModeComplete', false);
    // isContinuousLayoutRunning.value = true;
    emit('update:isContinuousLayoutRunning', false);
    const autoModeStartTime = Date.now();

    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log({ wakeLock });
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }

    async function expandPersonNodes () {
      let allFullyExpanded = true;

      for (const node of cy.$('.person')) {
        if (!isAutoModeRunning.value) { break; }

        const id = node.id();

        const { fullyExpanded } = await fetchAndExpandNode(id);

        allFullyExpanded &&= fullyExpanded;
      }

      if (allFullyExpanded) {
        // isAutoModeRunning.value = false;
        emit('update:isAutoModeRunning', false);
        cy.animate({
          fit: { eles: undefined, padding },
        });
        lastAutoModeTime.value = Date.now() - autoModeStartTime;
        // isAutoModeComplete.value = true;
        emit('update:isAutoModeComplete', true);
      }

      if (isAutoModeRunning.value) {
        expandPersonNodes();
      }
      else {
        // isContinuousLayoutRunning.value = false;
        emit('update:isContinuousLayoutRunning', false);
        if (wakeLock) {
          wakeLock.release();
          console.log({ wakeLock });
          wakeLock = null;
        }
        saveState();
      }
    }
    expandPersonNodes();
  }
});

document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    wakeLock = await navigator.wakeLock.request('screen');
  }
});

onUnmounted(() => emit('update:isAutoModeRunning', false));

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

const selectMovie = async (movie) => {
  if (!movie) return;
  cy.nodes().remove()
  const id = `movie:${movie.id}`;
  cy.add([{
    data: { id },
    classes: ['movie', 'foreground'],
    pannable: true,
  }])
  await fetchAndExpandNode(id);
}

const focusId = (id) => {
  cy.fit(cy.$id(id), padding);
}

const onFilteredMovies = (ids) => {
  cy.batch(() => {
    cy.$('.movie').addClass('filtered');
    ids.forEach(id => cy.$id(id).removeClass('filtered'));
  });
};

defineExpose({
  allMovies,
  allPeople,
  loadingCount,
  lastAutoModeTime,
  lastLayoutTime,
  layoutOptions,
  runLayout,
  selectMovie,
  focusId,
  onFilteredMovies,
});
</script>