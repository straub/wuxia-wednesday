<template>
  <OModal
    class="modal-movie-search"
    :active="isSearching"
    @update:active="(newValue: MovieResult) => emit('update:isSearching', newValue)"
  >
    <OField label="Find a movie" label-size="large">
      <OAutocomplete
        ref="input"
        :data="data"
        placeholder="e.g. The Werewolf Game: Inferno"
        field="title"
        size="large"
        :loading="isFetching"
        check-infinite-scroll
        keep-first
        :debounce-typing="500"
        @typing="getAsyncData"
        @select="(movie: MovieResult) => emit('select', movie)"
        @infinite-scroll="getMoreAsyncData"
      >
        <template #default="{ option: movie }">
          <div class="media">
            <div v-if="movie.poster_path" class="media-left">
              <img
                width="32"
                crossorigin="anonymous"
                :src="`https://image.tmdb.org/t/p/w342${movie.poster_path}`"
              >
            </div>
            <div class="media-content">
              {{ movie.title }}
              <br>
              <small v-if="movie.release_date">
                ({{ movie.release_date.split('-')[0] }})
              </small>
              <small v-if="movie.vote_count > 10">
                {{ Math.round(movie.vote_average*100/10) }}%
              </small>
            </div>
          </div>
        </template>
        <template v-if="page > totalPages" #footer>
          <span class="ex-text-grey">
            Thats it! No more movies found.
          </span>
        </template>
      </OAutocomplete>
    </OField>
  </OModal>
</template>

<script setup lang="ts">
import { MovieDb } from 'moviedb-promise';
import { MovieResult } from 'moviedb-promise/dist/request-types';
import { OModal, OField, OAutocomplete } from '@oruga-ui/oruga-next';

const moviedb = new MovieDb('b95ecffb4e929829fbc815288785b66e');

const props = defineProps({
  isSearching: Boolean,
});

const emit = defineEmits(['update:isSearching', 'select']);

const input = ref<HTMLInputElement>();

watch(() => props.isSearching, () => nextTick(() => input.value?.focus()));

const isFetching = ref(false);
const page = ref(1);
const totalPages = ref(1);

const data = ref<MovieResult[]>([]);
const name = ref('');

async function getAsyncData (_name: string) {
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
    });

    data.value = [...data.value, ...(_data.results ?? [])];
    page.value += 1;
    totalPages.value = _data.total_pages ?? 0;
  } catch (error) {
    throw error;
  } finally {
    isFetching.value = false;
  }
}

function getMoreAsyncData () {
  getAsyncData(name.value);
}
</script>

<style lang="scss">
.modal-movie-search .o-modal__content {
  overflow: visible;
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
</style>
