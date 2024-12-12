<template>
  <OModal
    class="modal-movies-list"
    :active="isShowing"
    width="100%"
    @update:active="(newValue: boolean) => emit('update:isShowing', newValue)"
  >
    <div class="modal-header">
      <h2>
        {{ table?.newDataTotal }} {{ table?.newDataTotal === 1 ? 'movie' : 'movies' }}{{
          isFiltered ? ` out of ${movies.length}` : ''
        }}
      </h2>
      <div class="controls">
        <a
          v-if="hasWebShareApi && stars.size"
          class="share-shortlist"
          href="#"
          @click.prevent="shareShortlist"
        >Share Your Shortlist</a>
        <a
          v-if="isFiltered"
          class="reset-filters"
          href="#"
          @click.prevent="() => {
            if (table) {
              table.filters = {};
              Object.keys(filters).forEach(key => delete filters[key]);
            }
          }"
        >Reset Filters</a>
        <OCollapse
          :open="false"
          class="card"
          animation="slide"
          trigger-class="trigger-fullwidth"
        >
          <template #trigger="props">
            <div class="card-header" role="button">
                <span class="card-header-title">
                    More Filters
                </span>
                <a class="card-header-icon">
                    <o-icon :icon="props.open ? 'menu-up' : 'menu-down'">
                    </o-icon>
                </a>
            </div>
          </template>
          <div class="card-content">
            <OInputitems
              v-model="filters.includeCast"
              :data="filteredIncludeAvailableCast"
              :allow-autocomplete="true"
              :allow-new="false"
              :open-on-focus="true"
              :keep-first="true"
              :confirm-keys="[',','Enter']"
              icon=""
              variant="info"
              size="small"
              placeholder="Include cast..."
              @typing="(text: string) => includeCastFilterText = text"
            />
            <OInputitems
              v-model="filters.excludeCast"
              :data="filteredExcludeAvailableCast"
              :allow-autocomplete="true"
              :allow-new="false"
              :open-on-focus="true"
              :keep-first="true"
              :confirm-keys="[',','Enter']"
              icon=""
              variant="info"
              size="small"
              placeholder="Exclude cast..."
              @typing="(text: string) => excludeCastFilterText = text"
            />
          </div>
        </OCollapse>
      </div>
    </div>
    <OTable
      ref="table"
      :data="filteredRows"
      custom-row-key="id"
      :default-sort="savedSort.field"
      :default-sort-direction="savedSort.direction"
      detailed
      show-detail-icon
      custom-detail-row
      detail-key="id"
      :debounce-search="150"
      :backend-filtering="true"
      @filters-change="(newFilters: Filters) => filters = newFilters"
      @sort="(field, direction) => { savedSort = { field, direction } }"
    >
      <OTableColumn
        v-for="column in columns"
        :key="column.field"
        v-bind="column"
      >
        <template #default="{ row }">
          <OIcon
            v-if="column.field === 'star'"
            title="Add to shortlist"
            :icon="stars.has(row.id) ? 'star' : 'star-outline'"
            :style="{cursor:'pointer'}"
            size="small"
            @click.prevent="stars.has(row.id) ? stars.delete(row.id) : stars.add(row.id)"
          />
          <img
            v-else-if="column.field === 'poster_path' && row.poster_path"
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
          <OSwitch
            v-else-if="column.field === 'star'"
            v-model="filters.star"
            title="Show shortlist"
            :style="{ opacity: filters.star || stars.size ? 1 : 0 }"
            variant="info"
          />
          <OInputitems
            v-else-if="column.field === 'genres'"
            v-model="filters.genres"
            :data="filteredAvailableGenres"
            :allow-autocomplete="true"
            :allow-new="false"
            :open-on-focus="true"
            :keep-first="true"
            :confirm-keys="[',','Enter']"
            icon=""
            variant="info"
            size="small"
            placeholder="Filter..."
            @typing="(text: string) => genreFilterText = text"
          />
          <OInput
            v-else
            v-model="filters[column.field]"
            :type="column.numeric ? 'number' : 'text'"
            size="small"
            placeholder="Filter..."
            icon-right="close"
            icon-right-clickable
            @icon-right-click="delete filters[column.field]"
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
                  :style="{cursor:'pointer'}"
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
import { OModal, OTable, OTableColumn, OIcon, OInput, OSwitch, OInputitems, OCollapse } from '@oruga-ui/oruga-next';

type ExtendedMovieResponse = MovieResponse & { id: string, credits: CreditsResponse }

type Filters = { [key : string]: string | [number, number] | Array<string> }

export interface Props {
  isShowing: Boolean,
  movies: ExtendedMovieResponse[],
  people: Cast[],
}

const props = defineProps<Props>();

const emit = defineEmits(['update:isShowing', 'focus', 'filteredMovies']);

// There's a lot of state in filters, and we want to preserve it so it doesn't
// get reset if a user closes the modal and comes back.
const table = ref<{ filters: Filters, newData: { id: string }[], newDataTotal: number }>();

const isFiltered = computed(() => table.value?.newDataTotal !== props.movies.length);

const filters = ref<Filters>({});

const savedSort = shallowRef({ field: undefined, direction: 'desc' });

watch(
  table,
  (newTable) => {
    if (newTable) {
      newTable.filters = { ...filters.value };
    }
  },
);

const makeCustomRangeSearchFunction = (field: string) => (input: [number, number], row: { [x: string]: number; }) => {
  if (Array.isArray(input)) {
    const [min, max] = input;
    return row[field] <= max && row[field] >= min;
  }
  return true;
};

const columns = ref([
  {
    field: 'star',
    searchable: true,
    customSearch (input: boolean, row: { star: boolean; }) {
      return !input || row.star === input;
    },
  },
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
    label: 'Genres',
    sortable: true,
    searchable: true,
    customSearch (input: string[], row: { genresSet: Set<string>; }) {
      return input && input.every((g: string) => row.genresSet.has(g));
    },
    customFormatter: (value : Genre[]) => `${value?.[0]}`,
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

const compiledFilters = computed(() => {
  const obj: { [x: string]: Function } = {};
  const filtersValue = filters.value;
  const columnsValue = columns.value;

  Object.keys(filtersValue).forEach((key) => {
    const filterValue = filtersValue[key];
    if (!filterValue) { return; }

    if (key === 'includeCast' || key === 'excludeCast') {
      obj[key] = (row: MovieResponse) => {
        return castFilteredByIdSet.value.has(row.id);
      };
      return;
    }

    const filterFunction =
      columnsValue.find(c => c.field === key)?.customSearch?.bind(null, filterValue) ??
      (row => String(row[key]).toLowerCase().includes(String(filterValue).toLowerCase()));

    obj[key] = filterFunction;
  });
  return obj;
});

const numberFormatter = new Intl.NumberFormat();

const stars = reactive(new Set<string>());

const rows = computed(() => props.movies.map((movie: ExtendedMovieResponse) => ({
  ...movie,
  star: stars.has(movie.id),
  release_year: Number(movie.release_date?.split('-')[0]),
  genres: movie.genres?.map(g => g.name),
  genresSet: new Set(movie.genres?.map(g => g.name)),
  vote_average: movie.vote_average && Math.round(movie.vote_average * 10),
  popularity: movie.popularity && Math.round(movie.popularity),
  cast_num: movie.credits?.cast?.length,
})));

const filteredRows = computed(() => {
  const filterFunctions = Object.values(compiledFilters.value);
  if (!filterFunctions.length) { return rows.value; }
  console.log('filtering rows', compiledFilters.value);
  const filteredRows = rows.value.filter(row => filterFunctions.every(f => f(row)));
  return filteredRows;
});

watch(
  filteredRows,
  (newFilteredRows) => {
    if (newFilteredRows) {
      emit('filteredMovies', newFilteredRows.map(r => r.id));
    }
  },
);

const availableGenres = computed(() => {
  return Array.from(
    new Set(
      rows.value
        .map(r => r.genres)
        .flat()
        .filter(g => !!g),
    ),
  )
    .sort();
});

const genreFilterText = ref('');

const filteredAvailableGenres = computed(() => {
  const text = genreFilterText.value?.toLowerCase();
  return availableGenres.value.filter(genre => genre?.toLowerCase().includes(text));
});

const availableCast = computed(() => {
  return Array.from(
    new Set(
      rows.value
        .map(r => r.credits.cast?.map(c => c.name))
        .flat()
        .filter(c => !!c),
    ),
  ).sort();
});

const includeCastFilterText = ref('');
const excludeCastFilterText = ref('');

const filteredIncludeAvailableCast = computed(() => {
  const text = includeCastFilterText.value?.toLowerCase();
  return availableCast.value
  .filter(cast => cast?.toLowerCase().includes(text))
  .slice(0, 20);
});

const filteredExcludeAvailableCast = computed(() => {
  const text = excludeCastFilterText.value?.toLowerCase();
  return availableCast.value
  .filter(cast => cast?.toLowerCase().includes(text))
  .slice(0, 20);
});

const castFilteredByIdSet = computed(() => {
  const { includeCast, excludeCast } = filters.value;

  const filteredRows = rows.value.filter(row => {
    if (includeCast instanceof Array) {
      // If not every cast member to include is in this movie, return false.
      if (!includeCast.every(c => row.credits?.cast?.some(cast => cast.name === c))) {
        return false;
      }
    }
    if (excludeCast instanceof Array) {
      // If any cast member to exclude is in this movie, return false.
      if (excludeCast.some(c => row.credits?.cast?.some(cast => cast.name === c))) {
        return false;
      }
    }
    return true;
  });

  return new Set(filteredRows.map(r => r.id));
});

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

const hasWebShareApi = !!navigator.share;

const shortlistShareText = computed(() => rows.value
  .filter(r => r.star)
  .map(r => `${r.title} (${r.release_year}) ${r.runtime}m ${r.vote_average}%`)
  .join('\n'));

function shareShortlist () {
  if (navigator.share) {
    return navigator.share({
      title: 'My Wuxia Wednesday Shortlist',
      text: shortlistShareText.value,
    })
      .catch(console.error);
  }
}
</script>

<style lang="scss">
.modal-movies-list {
  .o-modal__content {
    width: 90vw;
  }
  .movie-list-details {
    margin-right: 1rem;
    margin-bottom: 1rem;
    float: left;
    width: 20%;
  }
  .modal-header {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;

    .controls {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-end;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
    }
  }
  .o-table__td {
      vertical-align: middle;
  }
  .o-switch {
    transition: opacity 200ms;
  }
  .o-inputit__item {
      color: #fff;
  }
  // Hack in some space for the sort icon.
  .o-table__th-current-sort[draggable=false] > span {
    padding-right: 1rem;
    display: inline-block;
  }
}
</style>
