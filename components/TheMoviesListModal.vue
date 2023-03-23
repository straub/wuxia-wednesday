<template>
  <OModal
    class="modal-movies-list"
    :active="isShowing"
    @update:active="(newValue: boolean) => emit('update:isShowing', newValue)"
  >
    <OTable
      :data="rows"
      default-sort-direction="desc"
    >
      <OTableColumn
        v-for="column in columns"
        v-bind="column"
        #default="{ row }"
      >
        <img
          v-if="column.field == 'poster' && row.poster_path"
          width="32"
          crossorigin="anonymous"
          :src="`https://image.tmdb.org/t/p/w500${row.poster_path}`"
        />
        <a
          v-else-if="column.field === 'title'"
          :href="`https://www.themoviedb.org/${row.id.replace(':', '/')}`"
          target="_blank"
          title="Open on TMDb"
        >
          {{ row.title }}
        </a>
        <span v-else>{{ row[column.field] ?? '~' }}</span>
      </OTableColumn>
    </OTable>
  </OModal>
</template>

<script setup lang="ts">
import { MovieResponse, CreditsResponse } from 'moviedb-promise/dist/request-types'
import { OModal, OTable, OTableColumn } from '@oruga-ui/oruga-next'

type ExtendedMovieResponse = MovieResponse & { credits: CreditsResponse }

const props = defineProps<{
  isShowing: Boolean,
  movies: ExtendedMovieResponse[],
}>()

const emit = defineEmits(['update:isShowing']);

const columns = ref([
  {
    field: 'poster',
    label: 'Poster',
  },
  {
    field: 'title',
    label: 'Title',
    sortable: true,
  },
  {
    field: 'release_year',
    label: 'Release',
    sortable: true,
  },
  {
    field: 'vote_average',
    label: 'Vote Avg',
    sortable: true,
  },
  {
    field: 'vote_count',
    label: 'Vote Count',
    sortable: true,
  },
  {
    field: 'popularity',
    label: 'Popularity',
    sortable: true,
  },
  {
    field: 'runtime',
    label: 'Runtime',
    sortable: true,
  },
  {
    field: 'cast_num',
    label: 'Cast',
    sortable: true,
  },
]);

const rows = computed(() => props.movies.map((movie: ExtendedMovieResponse) => ({
  ...movie,
  release_year: movie.release_date?.split('-')[0],
  vote_average: movie.vote_average && `${Math.round(movie.vote_average*100/10)}%`,
  runtime: movie.runtime && `${movie.runtime}m`,
  cast_num: movie.credits.cast?.length,
})))
</script>

<style lang="scss">
.modal-movies-list .o-modal__content {
  width: 70vw;
}
</style>