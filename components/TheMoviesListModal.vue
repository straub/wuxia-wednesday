<template>
  <OModal
    class="modal-movies-list"
    :active="isShowing"
    @update:active="(newValue: boolean) => emit('update:isShowing', newValue)"
  >
    <h2>{{ movies.length }} {{ movies.length === 1 ? 'movie' : 'movies' }}</h2>
    <OTable
      :data="rows"
      default-sort-direction="desc"
      detailed
      show-detail-icon
      custom-detail-row
    >
      <OTableColumn
        v-for="column in columns"
        :key="column.field"
        v-slot="{ row }"
        v-bind="column"
      >
        <img
          v-if="column.field == 'poster' && row.poster_path"
          width="32"
          crossorigin="anonymous"
          :src="`https://image.tmdb.org/t/p/w500${row.poster_path}`"
        >
        <a
          v-else-if="column.field === 'title'"
          :href="`https://www.themoviedb.org/${row.id.replace(':', '/')}`"
          target="_blank"
          title="Open on TMDb"
        >
          {{ row[column.field] }}
        </a>
        <template v-else-if="column.field === 'vote_average'">
          {{ Math.round(row[column.field] * 100 / 10) }}%
        </template>
        <template v-else-if="column.field === 'runtime'">
          {{ row[column.field] }}m
        </template>
        <template v-else-if="column.numeric">
          {{ numberFormatter.format(row[column.field]) }}
        </template>
        <template v-else>
          {{ row[column.field] ?? '~' }}
        </template>
      </OTableColumn>

      <template #detail="{ row }">
        <tr>
          <td />
          <td colspan="100">
            <div>
              <img
                v-if="row.poster_path"
                class="movie-list-details"
                crossorigin="anonymous"
                :src="`https://image.tmdb.org/t/p/w500${row.poster_path}`"
              >
              <p>
                <em>{{ row.tagline }}</em>
                <OIcon
                  title="Focus"
                  icon="image-filter-center-focus"
                  size="small"
                  @click="$emit('focus', row.id)"
                />
              </p>
              <p>{{ row.overview }}</p>
              <p>{{ row.credits?.cast?.slice(0, 5).map(p => p.name).join(', ') }}</p>
            </div>
          </td>
        </tr>
      </template>
    </OTable>
  </OModal>
</template>

<script setup lang="ts">
import { MovieResponse, CreditsResponse } from 'moviedb-promise/dist/request-types';
import { OModal, OTable, OTableColumn, OIcon } from '@oruga-ui/oruga-next';

type ExtendedMovieResponse = MovieResponse & { credits: CreditsResponse }

const props = defineProps<{
  isShowing: Boolean,
  movies: ExtendedMovieResponse[],
}>();

const emit = defineEmits(['update:isShowing', 'focus']);

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
    label: 'User Score',
    sortable: true,
  },
  {
    field: 'vote_count',
    label: 'Ratings',
    sortable: true,
    numeric: true,
  },
  {
    field: 'popularity',
    label: 'Popularity',
    sortable: true,
    numeric: true,
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
    numeric: true,
  },
]);

const numberFormatter = new Intl.NumberFormat();

const rows = computed(() => props.movies.map((movie: ExtendedMovieResponse) => ({
  ...movie,
  release_year: movie.release_date?.split('-')[0],
  popularity: movie.popularity && Math.round(movie.popularity),
  cast_num: movie.credits?.cast?.length,
})));
</script>

<style lang="scss">
.modal-movies-list .o-modal__content {
  width: 70vw;
}
.modal-movies-list .movie-list-details {
  margin-right: 1rem;
  margin-bottom: 1rem;
  float: left;
  width: 20%;
}
</style>
