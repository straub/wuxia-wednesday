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
    ></div>
    <TheMovieSearchModal
      v-model:is-searching="isSearching"
      @select="movie => {
        if (!movie) return;
        cy.nodes().remove()
        const ele = cy.add([{
          data: { ...movie, id: `movie:${movie.id}` },
          classes: ['movie', 'foreground'],
          pannable: true,
        }])
        cy.fit(ele, padding)
        isSearching = false
      }"
    ></TheMovieSearchModal>
    <TheAboutModal v-model:is-showing="isShowingAbout"></TheAboutModal>
    <TheLogo v-model:is-glitching="isGlitching"></TheLogo>
    <div id="toolbar">
      <OField>
        <OButton
          @click="cy.fit(undefined, padding)"
          size="small" title="Fit All" icon-right="fit-to-page-outline"></OButton>
        <OButton
          @click="cy.fit(cy.$('node.foreground'), padding)"
          size="small" title="Focus on Highlighted" icon-right="image-filter-center-focus"></OButton>
        <OButton
          @click="isSearching = true"
          size="small" title="Search" icon-right="movie-search-outline"></OButton>
        <OButton
          @click="saveToUrl"
          size="small" title="Save to URL" icon-right="content-save-outline"></OButton>
        <OButton
          @click="isShowingAbout = true"
          size="small" title="About" icon-right="information-outline"></OButton>
        <!-- <OButton @click="" size="small" title="Settings" icon-right="cog-outline"></OButton> -->
      </OField>
      <div id="attribution">
        Data from&nbsp;<a
          target="_blank"
          href="https://www.themoviedb.org/"
        ><img
            title="The Movie Database"
            src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
          />
        </a>
      </div>
    </div>
    <OLoading full-page v-model:active="isLoading"></OLoading>
  </div>
</template>

<script setup>
import { Buffer } from 'buffer'
import cytoscape from 'cytoscape'
import fcose from 'cytoscape-fcose'
import cola from 'cytoscape-cola'
import layoutUtilities from 'cytoscape-layout-utilities';
import { MovieDb } from 'moviedb-promise'
import { OLoading, OField, OButton } from '@oruga-ui/oruga-next'
import { gzip, ungzip } from 'pako'

cytoscape.use(fcose)
cytoscape.use(cola)
cytoscape.use(layoutUtilities)

/** @type {cytoscape.Core} */
let cy

const moviedb = new MovieDb('b95ecffb4e929829fbc815288785b66e')

const isLoading = ref(true)
const isSearching = ref(false)
const isShowingAbout = ref(false)
const isGlitching = ref(false)

const cursor = ref('inherit')
const title = ref('')

const padding = 30

const fetchMovie = async id => {
  id = String(id).replace('movie:', '')

  const movie = await moviedb.movieInfo({ id, append_to_response: 'credits', language: 'en-US' })
  return movie
}

const fetchPerson = async id => {
  id = String(id).replace('person:', '')

  const person = await moviedb.personInfo({ id, append_to_response: 'movie_credits', language: 'en-US' })
  return person
}

const ELEMENTS_HASH_PREFIX = '#elements:'

const saveToUrl = () => location.hash = `${ELEMENTS_HASH_PREFIX}${Buffer.from(
    gzip(
      JSON.stringify(cy.elements().jsons())
    )
  ).toString('base64')}`

onMounted(async () => {

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
        }
      },
      {
        selector: 'node.movie',
        style: {
          // label: 'data(title)',
          label: ele => `${
            !ele.data('poster_path') || ele.data('original_language') !== 'en' ?
            `${ele.data('title')}\n` :
            ''
          }${
            ele.data('release_date') ? `(${
              ele.data('release_date').split('-')[0]
            }) ` : ''
          }${
            ele.data('vote_count') > 10 ? `${
              Math.round(ele.data('vote_average')*100/10)
            }% `: ''
          }${
            ele.data('runtime') ? `${ele.data('runtime')}m` : ''
          }`,
          'text-margin-y': 5,
          width: 45,
          height: 68,
          'z-index': 1,
          shape: 'round-rectangle',
          'background-image': ele => 'https://image.tmdb.org/t/p/w500' + ele.data('poster_path'),
        }
      },
      {
        selector: 'node.movie[!poster_path]',
        style: {
          'text-margin-y': 0,
          'text-valign': 'center',
          'background-fill': 'solid',
          'background-color': '#333',
          'background-image': null,
        }
      },
      {
        selector: 'node.person',
        style: {
          label: 'data(name)',
          width: 45,
          height: 45,
          'z-index': 2,
          shape: 'ellipse',
          'background-image': ele => 'https://image.tmdb.org/t/p/w185' + ele.data('profile_path'),
          'background-offset-y': '-40%',
        }
      },
      {
        selector: 'node.person[!profile_path]',
        style: {
          'text-valign': 'center',
          'background-fill': 'solid',
          'background-color': '#333',
          'background-image': null,
        }
      },
      {
        selector: 'node.background',
        style: {
          opacity: 0.4,
          'transition-property': 'opacity',
          'transition-duration': '2s',
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#333',
          'curve-style': 'straight',
        }
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
        }
      },
    ],
  }

  cy = cytoscape({
    ...config,
    container: document.getElementById('cy'),
  });

  if (location.hash.startsWith(ELEMENTS_HASH_PREFIX)) {
    const elements = JSON.parse(
      ungzip(
        Buffer.from(
          location.hash.replace(ELEMENTS_HASH_PREFIX, ''),
          'base64'
        ),
        { to: 'string' },
      )
    )
    console.log({ elements })

    cy.add(elements)
  }
  else {
    const { results: [{ id: mostPopularId }] } = await moviedb.moviePopular()

    console.log({ mostPopularId });

    const initialMovie = await fetchMovie(mostPopularId)
    // const initialMovie = await fetchMovie(614919)
    // const initialMovie = await fetchMovie(287757)

    console.log({ initialMovie });

    const elements = [
      {
        group: 'nodes',
        data: { ...initialMovie, id: `movie:${initialMovie.id}` },
        classes: ['movie', 'foreground'],
        pannable: true,
      },
    ]

    cy.add(elements)
  }

  cy.fit(undefined, padding)
  isLoading.value = false

  const layoutUtil = cy.layoutUtilities()

  /**
   * @param {cytoscape.NodeSingular} ele
   * @param {function} cb
   */
  const runLayout = (ele, cb) => cy.layout({
    name: 'fcose',
    nodeDimensionsIncludeLabels: true,
    fit: false,
    randomize: false,
    quality: 'proof',
    // edgeElasticity: edge => 0.3,
    // nodeRepulsion: node => 10000,
    padding,
    fixedNodeConstraint: ele ? [{ nodeId: ele.id(), position: ele.position() }] : [],
    stop: cb,
  })
  .run()

  /**
   * @param {string} id
   * @param {Object} [newData]
   */
  function expandNode (id, newData = {}) {
    const type = id.split(':')[0]
    const otherType = type === 'movie' ? 'person' : 'movie'
    const ele = cy.getElementById(id)
    const {
      name, title, profile_path, poster_path, original_language, release_date, vote_count, vote_average
    } = newData
    ele.data({
      name, title, profile_path, poster_path, original_language, release_date, vote_count, vote_average
    });
    console.log({ id, type, newData, ele })

    const currentPage = ele.data('currentPage') ?? 0;
    ele.data('currentPage', currentPage + 1)

    const allCredits = [
      ...(newData.credits ?? newData.movie_credits).cast,
      ...(newData.credits ?? newData.movie_credits).crew,
    ]

    const newNodes = allCredits
    // .filter(credit => cy.getElementById(`movie:${credit.id}`).length === 0)
    // .sort((a, b) => b.vote_average - a.vote_average)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(currentPage * 10, (currentPage + 1) * 10)
    .map(credit => {
      return [
        {
          group: 'nodes',
          data: { ...credit, id: `${otherType}:${credit.id}` },
          classes: [otherType],
          // position: { ...ele.position() },
          pannable: true,
        },
      ]
    })
    .flat()

    const allEdges = allCredits
    .map(credit => {
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
          }
        },
      ]
    })
    .flat()

    layoutUtil.placeNewNodes(
      cy.add(newNodes)
    )

    const allValidEdges = allEdges
    .filter(edge => cy.$id(edge.data.source).size() && cy.$id(edge.data.target).size())

    cy.add(allValidEdges)

    cy.nodes().addClass('background').removeClass('foreground')
    const neighborhood = ele.closedNeighborhood()
    neighborhood.removeClass('background').addClass('foreground')

    cy.animate({ center: { eles: ele } })

    if (newNodes.length) runLayout(
      ele,
      () => cy.animate({ fit: { eles: neighborhood, padding } })
    )
  }

  cy
  .on('onetap', 'node', async (evt) => {
    const node = evt.target;
    const id = node.id()
    console.log( 'onetapped ' + id );

    try {
      isLoading.value = true

      if (id.startsWith('movie:')) {
        const movie = await fetchMovie(id)
        expandNode(id, movie)
      }
      else if (id.startsWith('person:')) {
        const person = await fetchPerson(id)
        expandNode(id, person)
      }
    }
    finally {
      isLoading.value = false
    }
  })
  .on('dbltap', 'node', async (evt) => {
    const node = evt.target;
    const id = node.id()
    console.log( 'dbltapped ' + id );

    if (id.startsWith('movie:') || id.startsWith('person:')) {
      window.open(`https://www.themoviedb.org/${id.replace(':', '/')}`)
    }
  })
  .on('mouseover', 'node', (evt) => {
    const node = evt.target;
    cursor.value = 'pointer'
    title.value = node.data('title') ?? ''
  })
  .on('mouseout', 'node', () => {
    cursor.value = 'inherit'
    title.value = ''
  })
})
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

  & .o-field {
    display: inline-block;
    margin-bottom: 0;
  }
}

#attribution {
  display: inline-block;
  padding-left: 1rem;
  vertical-align: bottom;
  margin-bottom: -3px;
}

.o-load__overlay {
  background: rgba(0, 0, 0, 0.3);
}
</style>