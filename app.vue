<template>
  <div
    id="container"
    @mousedown="animateH1"
    @touchend="animateH1"
  >
    <div
      id="cy"
      :style="{ cursor }"
    >
    </div>
    <OModal
      v-model:active="isSearching"
    >
      <OField label="Find a movie" label-size="large">
        <OAutocomplete
          :data="data"
          placeholder="e.g. Werewolf Game: Inferno"
          field="title"
          size="large"
          :loading="isFetching"
          check-infinite-scroll
          keep-first
          :debounce-typing="500"
          ref="input"
          @typing="getAsyncData"
          @select="(option) => {
            if (!option) return;
            cy.nodes().remove()
            const ele = cy.add([{
              data: { ...option, id: `movie:${option.id}` },
              classes: ['movie', 'foreground'],
              pannable: true,
            }])
            cy.fit(ele, padding)
            isSearching = false
          }"
          @infinite-scroll="getMoreAsyncData"
        >
          <template #default="props">
            <div class="media">
              <div class="media-left">
                <img
                  width="32"
                  crossorigin="anonymous"
                  :src="`https://image.tmdb.org/t/p/w342${props.option.poster_path}`"
                />
              </div>
              <div class="media-content">
                {{ props.option.title }}
                <br />
                <small>
                  ({{ props.option.release_date.split('-')[0] }})
                  {{ props.option.vote_count > 0 ? Math.round(props.option.vote_average*100/10) : '' }}%
                </small>
              </div>
            </div>
          </template>
          <template #footer v-if="page > totalPages">
            <span class="ex-text-grey">
              Thats it! No more movies found.
            </span>
          </template>
        </OAutocomplete>
      </OField>
    </OModal>
    <h1 :class="{ glitch: isH1Animating }"  data-text="Wuxia Wednesday">
      Wuxia Wednesday
    </h1>
    <div id="toolbar">
      <button @click="cy.fit(undefined, padding)">Fit</button>
      <button @click="cy.fit(cy.$('node.foreground'), padding)">Focus</button>
      <button @click="isSearching = true">Search</button>
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
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import cytoscape from 'cytoscape'
import fcose from 'cytoscape-fcose'
import cola from 'cytoscape-cola'
import layoutUtilities from 'cytoscape-layout-utilities';
import { MovieDb } from 'moviedb-promise'

import { OModal, OField, OAutocomplete } from '@oruga-ui/oruga-next'
import '@oruga-ui/oruga-next/dist/oruga.css'

const moviedb = new MovieDb('b95ecffb4e929829fbc815288785b66e')

const isSearching = ref(false);

const input = ref(null)

watch(isSearching, () => nextTick(() => input.value?.focus()))

const isFetching = ref(false);
const page = ref(1);
const totalPages = ref(1);

const data = ref([]);
const selected = ref(null);
const name = ref('');

async function getAsyncData(_name) {
  if (name.value !== _name) {
    name.value = _name;
    data.value = [];
    page.value = 1;
    totalPages.value = 1;
  }

  // String cleared
  if (!_name.length) {
    data.value = [];
    page.value = 1;
    totalPages.value = 1;

    return;
  }

  // Reached last page
  if (page.value > totalPages.value) {
    return;
  }

  isFetching.value = true;
  try {
    const _data = await moviedb.searchMovie({
      query: _name,
      page: page.value,
    })

    data.value = [...data.value, ..._data.results];
    page.value += 1;
    totalPages.value = _data.total_pages;
  } catch(error) {
    throw error;
  } finally {
    isFetching.value = false;
  }
}

function getMoreAsyncData() {
  getAsyncData(name.value);
}

cytoscape.use(fcose)
cytoscape.use(cola)
cytoscape.use(layoutUtilities)

let cy

let isH1Animating = ref(false)
const animateH1 = () => {
  console.log('animating h1')
  isH1Animating.value = true
  setTimeout(() => isH1Animating.value = false, 1000 + 2000 * Math.random())
}

let cursor = ref('inherit')

const padding = 30

const { results: [{ id: mostPopularId }] } = await moviedb.moviePopular()

console.log({ mostPopularId });

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

const mostPopular = await fetchMovie(mostPopularId)
// const mostPopular = await fetchMovie(614919)
// const mostPopular = await fetchMovie(287757)

console.log({ mostPopular });

onMounted(() => {

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
          'text-max-width': 200,
          'text-valign': 'bottom',
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
          }(${ele.data('release_date').split('-')[0]}) ${
            ele.data('vote_count') > 0 ? `${
              Math.round(ele.data('vote_average')*100/10)
            }% `: ''
          }${
            ele.data('runtime') ? `${ele.data('runtime')}m` : ''
          }`,
          'text-margin-y': 5,
          width: 92,
          height: 138,
          'z-index': 1,
          shape: 'round-rectangle',
          'background-image': ele => 'https://image.tmdb.org/t/p/w500' + ele.data('poster_path'),
        }
      },
      {
        selector: 'node.person',
        style: {
          label: 'data(name)',
          // label: ele => `${ele.data('name')} (${ele.data('movie_credits').length})`,
          width: 45,
          height: 45,
          'z-index': 2,
          shape: 'ellipse',
          'background-image': ele => 'https://image.tmdb.org/t/p/w185' + ele.data('profile_path'),
        }
      },
      {
        selector: 'node.rating',
        style: {
          label: 'data(text)',
          width: 30,
          height: 30,
          shape: 'round-rectangle',
          'text-valign': 'center',
          'display': 'none',
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
          'source-text-offset': 20,
          'min-zoomed-font-size': 20,
          'source-label': 'data(billing)',
        }
      },
    ],
  }

  const elements = [
    {
      data: { ...mostPopular, id: `movie:${mostPopular.id}` },
      classes: ['movie', 'foreground'],
      pannable: true,
    },
  ]

  cy = cytoscape({
    ...config,
    container: document.getElementById('cy'),
    elements,
  });

  const layoutUtil = cy.layoutUtilities()

  const runLayout = (fixedNodeConstraint, cb) => cy.layout({
    name: 'fcose',
    nodeDimensionsIncludeLabels: true,
    fit: false,
    randomize: false,
    quality: 'proof',
    // edgeElasticity: edge => 0.3,
    // nodeRepulsion: node => 10000,
    padding,
    fixedNodeConstraint,
    stop: cb,
  })
  .run()
  
  console.log({ cy })

  function expandMovie (movie) {
    const ele = cy.getElementById(`movie:${movie.id}`)
    ele.data(movie);
    console.log({ movie, ele })
    const currentPage = ele.data('currentPage') ?? 0;
    ele.data('currentPage', currentPage + 1)
    const newElements = [
      ...movie.credits.cast,
      // ...movie.credits.crew,
    ]
    // .filter(credit => cy.getElementById(`person:${credit.id}`).length === 0)
    // .sort((a, b) => b.popularity - a.popularity)
    .slice(currentPage, (currentPage + 1) * 10)
    .map(credit => ([
        {
          data: { ...credit, id: `person:${credit.id}` },
          classes: ['person'],
          // position: { ...ele.position() },
          pannable: true,
        },
        {
          data: {
            id: `movie:${movie.id}-person:${credit.id}`,
            source: `movie:${movie.id}`,
            target: `person:${credit.id}`,
            billing: `#${credit.order + 1}`,
          }
        },
    ]))
    .flat()
    layoutUtil.placeNewNodes(
      cy.add(newElements)
    )
    cy.nodes().addClass('background').removeClass('foreground')
    const neighborhood = ele.closedNeighborhood()
    neighborhood.removeClass('background').addClass('foreground')
    cy.animate({ center: { eles: ele } })
    if (newElements.length) runLayout(
      [{ nodeId: ele.id(), position: ele.position() }],
      () => cy.animate({ fit: { eles: neighborhood, padding } })
    )
  }

  function expandPerson (person) {
    const ele = cy.getElementById(`person:${person.id}`)
    ele.data(person);
    console.log({ person, ele })
    const currentPage = ele.data('currentPage') ?? 0;
    ele.data('currentPage', currentPage + 1)
    const newElements = [
      ...person.movie_credits.cast,
      ...person.movie_credits.crew,
    ]
    // .filter(credit => cy.getElementById(`movie:${credit.id}`).length === 0)
    // .sort((a, b) => b.vote_average - a.vote_average)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(currentPage, (currentPage + 1) * 10)
    .map(credit => ([
        {
          data: { ...credit, id: `movie:${credit.id}` },
          classes: ['movie'],
          // position: { ...ele.position() },
          pannable: true,
        },
        {
          data: {
            id: `movie:${credit.id}-person:${person.id}`,
            source: `movie:${credit.id}`,
            target: `person:${person.id}`,
            billing: `#${credit.order + 1}`,
          }
        },
        {
          data: { id: `rating:${credit.id}`, text: `${Math.round(credit.vote_average*100/10)}%` },
          classes: ['rating'],
          // position: { ...ele.position() },
          pannable: true,
        },
        {
          data: {
            id: `rating:${credit.id}-movie:${credit.id}`,
            source: `rating:${credit.id}`,
            target: `movie:${credit.id}`,
          }
        },
    ]))
    .flat()
    layoutUtil.placeNewNodes(
      cy.add(newElements)
    )
    cy.nodes().addClass('background').removeClass('foreground')
    const neighborhood = ele.closedNeighborhood()
    neighborhood.removeClass('background').addClass('foreground')
    cy.animate({ center: { eles: ele } })
    if (newElements.length) runLayout(
      [{ nodeId: ele.id(), position: ele.position() }],
      () => cy.animate({ fit: { eles: neighborhood, padding } })
    )
  }

  cy
  .on('onetap', 'node', async (evt) => {
    const node = evt.target;
    const id = node.id()
    console.log( 'onetapped ' + id );

    if (id.startsWith('movie:')) {
      const movie = await fetchMovie(id)
      expandMovie(movie)
    }
    else if (id.startsWith('person:')) {
      const person = await fetchPerson(id)
      expandPerson(person)
    }
  })
  .on('dbltap', 'node', async (evt) => {
    const node = evt.target;
    const id = node.id()
    console.log( 'dbltapped ' + id );

    const TMDB_BASE = 'https://www.themoviedb.org/'

    if (id.startsWith('movie:') || id.startsWith('person:')) {
      window.open(`https://www.themoviedb.org/${id.replace(':', '/')}`)
    }
  })
  .on('mouseover', 'node', () => cursor.value = 'pointer')
  .on('mouseout', 'node', () => cursor.value = 'inherit')
})
</script>

<style lang="scss">
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

#container, #cy {
  height: 100vh;
}

.o-modal__content {
  background-color: #000;
  padding: 2rem;
  overflow: visible;
}

.o-input {
  width: 50vw;
  line-height: 2rem;
  padding: 0 0.5rem;
}

.o-acp__menu {
  background-color: #000;
}

.media {
    align-items: flex-start;
    display: flex;
    text-align: left
}

.media-content {
    flex-basis: auto;
    flex-grow: 1;
    flex-shrink: 1;
    text-align: left;
    overflow-y: hidden;
    overflow-x: auto
}

.media-left {
    margin-right: 1rem;
    flex-basis: auto;
    flex-grow: 0;
    flex-shrink: 0
}

.ex-text-grey {
    color: grey
}

h1 {
  position: fixed;
  left: 1rem;
  bottom: 1.5rem;
  margin: 0;
  width: 100%;
  pointer-events: none;
}

@media (max-width:480px)  {
  h1 {
    top: 1.5rem;
  }
}

#toolbar {
  position: fixed;
  bottom: 1.5rem;
  right: 1rem;
}

#attribution {
  display: inline-block;
  padding-left: 1rem;
}

/* Glitch Animation - https://codepen.io/lbebber/pen/nqwBKK */

.glitch{
  position: fixed;
}
@keyframes noise-anim{
  $steps:20;
  @for $i from 0 through $steps{
    #{percentage($i*calc(1/$steps))}{
      clip:rect(random(100)+px,9999px,random(100)+px,0);
    }
  }
}
.glitch:after{
  content:attr(data-text);
  position:absolute;
  left:2px;
  text-shadow:-1px 0 red;
  top:0;
  color:white;
  background:black;
  overflow:hidden;
  clip:rect(0,900px,0,0); 
  animation:noise-anim 2s infinite linear alternate-reverse;
}

@keyframes noise-anim-2{
  $steps:20;
  @for $i from 0 through $steps{
    #{percentage($i*calc(1/$steps))}{
      clip:rect(random(100)+px,9999px,random(100)+px,0);
    }
  }
}
.glitch:before{
  content:attr(data-text);
  position:absolute;
  left:-2px;
  text-shadow:1px 0 blue; 
  top:0;
  color:white;
  background:black;
  overflow:hidden;
  clip:rect(0,900px,0,0); 
  animation:noise-anim-2 3s infinite linear alternate-reverse;
}
</style>