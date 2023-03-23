<template>
  <OModal
    class="modal-movies-list"
    :active="isShowing"
    @update:active="(newValue: boolean) => emit('update:isShowing', newValue)"
  >
    <OTable
      :data="movies"
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
        <span v-else-if="column.field === 'release_date' && row.release_date">
          {{ row.release_date.split('-')[0] }}
        </span>
        <span v-else-if="column.field === 'vote_average' && row.vote_average">
          {{ Math.round(row.vote_average*100/10) }}%
        </span>
        <span v-else-if="column.field === 'runtime' && row.runtime">
          {{ row.runtime }}m
        </span>
        <span v-else>{{ row[column.field] ?? '~' }}</span>
      </OTableColumn>
    </OTable>
  </OModal>
</template>

<script setup lang="ts">
import { OModal, OTable, OTableColumn } from '@oruga-ui/oruga-next'

defineProps({
  isShowing: Boolean,
  movies: Array
})

const openUrl = (url: string) => window.open(url)

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
  // {
  //   field: 'original_language',
  //   label: 'Lang',
  // },
  {
    field: 'release_date',
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
]);
</script>

<style lang="scss">
.modal-movies-list .o-modal__content {
  width: 70vw;
}
</style>