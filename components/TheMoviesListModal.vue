<template>
  <OModal
    class="modal-movies-list"
    :active="isShowing"
    width="100%"
    @update:active="(newValue: boolean) => emit('update:isShowing', newValue)"
  >
    <h2>
      {{ table?.newDataTotal }} {{ table?.newDataTotal === 1 ? 'movie' : 'movies' }}{{
        isFiltered ? ` out of ${movies.length}` : ''
      }}
    </h2>
    <a
      v-if="isFiltered"
      class="reset-filters"
      href="#"
      @click.prevent="table && (table.filters = {})"
    >Reset Filters</a>
    <OTable
      ref="table"
      :data="rows"
      default-sort-direction="desc"
      detailed
      show-detail-icon
      custom-detail-row
      :debounce-search="30"
    >
      <OTableColumn
        v-for="column in columns"
        :key="column.field"
        v-bind="column"
      >
        <template #default="{ row }">
          <img
            v-if="column.field == 'poster_path' && row.poster_path"
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
          <template v-else-if="column.customFormatter">
            {{ column.customFormatter(row[column.field]) }}
          </template>
          <template v-else-if="column.numeric">
            {{ numberFormatter.format(row[column.field]) }}
          </template>
          <template v-else>
            {{ row[column.field] ?? '~' }}
          </template>
        </template>
        <template #searchable="{ filters }">
          <FilterRangeSlider
            v-if="column.searchable && column.numeric"
            v-model="filters[column.field]"
            :min="mins[column.field].value"
            :max="maxes[column.field].value"
            :step="column.step"
            :custom-formatter="column.customFormatter"
          />
          <OInput
            v-else
            v-model="filters[column.field]"
            :type="column.numeric ? 'number' : 'text'"
            size="small"
            placeholder="Type to filter..."
          />
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
                <OIcon
                  title="Focus"
                  icon="image-filter-center-focus"
                  size="small"
                  @click="$emit('focus', row.id)"
                /> <em>{{ row.tagline }}</em>
              </p>
              <p>{{ row.genres?.join(', ') }}</p>
              <p>{{ row.overview }}</p>
              <p>{{ row.credits?.cast?.slice(0, 5).map((p: Cast) => p.name).join(', ') }}</p>
            </div>
          </td>
        </tr>
      </template>
    </OTable>
  </OModal>
</template>

<script setup lang="ts">
import { MovieResponse, CreditsResponse, Cast } from 'moviedb-promise/dist/request-types';
import { Genre } from 'moviedb-promise/dist/types';
import { OModal, OTable, OTableColumn, OIcon, OInput } from '@oruga-ui/oruga-next';

type ExtendedMovieResponse = MovieResponse & { credits: CreditsResponse }

type Filters = { [key : string]: string | [number, number] }

export interface Props {
  isShowing: Boolean,
  filters?: Filters,
  movies: ExtendedMovieResponse[],
}

const props = withDefaults(defineProps<Props>(), {
  filters: () => ({}),
});

const emit = defineEmits(['update:isShowing', 'update:filters', 'focus']);

// There's a lot of state in filters, and we want to preserve it so it doesn't
// get reset if a user closes the modal and comes back.
const table = ref<{ filters: Filters, newDataTotal: number }>();

const isFiltered = computed(() => table.value?.newDataTotal !== props.movies.length);

watch(
  table,
  (newTable) => {
    if (newTable) {
      console.log('newTable', newTable);
      newTable.filters = props.filters;
    }
  },
);

watch(
  () => table.value?.filters,
  (newFilters) => {
    if (newFilters) {
      console.log('newFilters', newFilters);
      emit('update:filters', newFilters);
    }
  },
  { deep: true },
);

const makeCustomRangeSearchFunction = (field : string) => (row, input) => {
  if (Array.isArray(input)) {
    const [min, max] = input;
    return row[field] <= max && row[field] >= min;
  }
  return true;
};

const columns = ref([
  {
    field: 'poster_path',
    label: 'Poster',
  },
  {
    field: 'title',
    label: 'Title',
    sortable: true,
    searchable: true,
  },
  {
    field: 'release_year',
    label: 'Release',
    sortable: true,
    numeric: true,
    searchable: true,
    customSearch: makeCustomRangeSearchFunction('release_year'),
    customFormatter: String,
  },
  {
    field: 'genres',
    label: 'Genre',
    sortable: true,
    searchable: true,
    customFormatter: (value : Genre[]) => value?.[0],
  },
  {
    field: 'vote_average',
    label: 'Score',
    sortable: true,
    numeric: true,
    searchable: true,
    customSearch: makeCustomRangeSearchFunction('vote_average'),
    customFormatter: (value : number) => `${value}%`,
  },
  {
    field: 'vote_count',
    label: 'Ratings',
    sortable: true,
    numeric: true,
    searchable: true,
    step: 10,
    customSearch: makeCustomRangeSearchFunction('vote_count'),
  },
  {
    field: 'popularity',
    label: 'Popularity',
    sortable: true,
    numeric: true,
    searchable: true,
    step: 10,
    customSearch: makeCustomRangeSearchFunction('popularity'),
  },
  {
    field: 'runtime',
    label: 'Runtime',
    sortable: true,
    numeric: true,
    searchable: true,
    customSearch: makeCustomRangeSearchFunction('runtime'),
    customFormatter: (value : number) => `${value}m`,
  },
  {
    field: 'cast_num',
    label: 'Cast',
    sortable: true,
    numeric: true,
    searchable: true,
    customSearch: makeCustomRangeSearchFunction('cast_num'),
  },
]);
type Field = typeof columns.value[number]['field'];

const numberFormatter = new Intl.NumberFormat();

const rows = computed(() => props.movies.map((movie: ExtendedMovieResponse) => ({
  ...movie,
  release_year: Number(movie.release_date?.split('-')[0]),
  genres: movie.genres?.map(g => g.name),
  vote_average: movie.vote_average && Math.round(movie.vote_average * 10),
  popularity: movie.popularity && Math.round(movie.popularity),
  cast_num: movie.credits?.cast?.length,
})));

interface StringToComputedNumber { [key: string]: ComputedRef<number> }

const mins : StringToComputedNumber = {};
const maxes : StringToComputedNumber = {};

// Compute a minimum and maximum for each of our searchable numeric fields.
columns.value
  .filter(({ searchable, numeric }: { searchable?: boolean, numeric?: boolean}) => searchable && numeric)
  .forEach(({ field }: { field: Field }) => {
    mins[field] = computed(() => rows.value.reduce((min, { [field]: value = Infinity }) => {
      if (value < min) { return value; }
      return min;
    }, Infinity));
    maxes[field] = computed(() => rows.value.reduce((max, { [field]: value = 0 }) => {
      if (value > max) { return value; }
      return max;
    }, 0));
  });
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
.reset-filters {
  position: absolute;
  top: 3.5rem;
  right: 2rem;
}
// Hack in some space for the sort icon.
.o-table__th-current-sort[draggable=false] > span {
  padding-right: 1rem;
  display: inline-block;
}
</style>
