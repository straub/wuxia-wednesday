<template>
  <OModal
    class="modal-bfs-path"
    :active="isShowing"
    @update:active="(newValue) => emit('update:isShowing', newValue)"
  >
    <h2>Path found — {{ path.length }} stops</h2>
    <table class="path-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Poster / Photo</th>
          <th>Name</th>
          <th>Connection</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in path"
          :key="item.id"
          :class="item.type"
        >
          <td>{{ index + 1 }}</td>
          <td>
            <img
              v-if="item.type === 'movie' && item.poster_path"
              :src="`https://image.tmdb.org/t/p/w92${item.poster_path}`"
              width="46"
              crossorigin="anonymous"
            >
            <img
              v-else-if="item.type === 'person' && item.profile_path"
              :src="`https://image.tmdb.org/t/p/w185${item.profile_path}`"
              width="46"
              crossorigin="anonymous"
            >
            <OIcon
              v-else
              :icon="item.type === 'movie' ? 'movie-outline' : 'account-outline'"
              size="medium"
            />
          </td>
          <td>
            <a
              :href="`https://www.themoviedb.org/${item.id.replace(/:/g, '/')}`"
              target="_blank"
            >
              {{ item.type === 'movie' ? item.title : item.name }}
            </a>
            <span
              v-if="item.type === 'movie' && item.release_date"
              class="year"
            >({{ item.release_date.split('-')[0] }})</span>
          </td>
          <td>
            <span
              v-if="item.via"
              class="via"
            >{{ item.via }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </OModal>
</template>

<script setup>
import { OModal, OIcon } from '@oruga-ui/oruga-next';

defineProps({
  isShowing: Boolean,
  path: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:isShowing']);
</script>

<style lang="scss">
.modal-bfs-path {
  .o-modal__content {
    width: 60vw;
    max-height: 80vh;
    overflow-y: auto;
  }

  h2 {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .path-table {
    width: 100%;
    border-collapse: collapse;

    th {
      text-align: left;
      color: #bbb;
      padding: 0.4rem 0.6rem;
      border-bottom: 1px solid #333;
    }

    td {
      padding: 0.4rem 0.6rem;
      vertical-align: middle;
      border-bottom: 1px solid #222;
    }

    tr.movie td:first-child {
      color: #01b4e4;
    }

    tr.person td:first-child {
      color: #90cea1;
    }

    img {
      display: block;
      border-radius: 3px;
    }

    .year {
      margin-left: 0.3rem;
      color: #888;
      font-size: 0.85em;
    }

    .via {
      color: #888;
      font-size: 0.85em;
    }
  }
}
</style>
