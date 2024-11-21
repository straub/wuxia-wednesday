import { CytoscapeOptions } from 'cytoscape';

export default [
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
      'min-zoomed-font-size': 12,
      'text-wrap': 'wrap',
      'text-max-width': 100,
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-justification': 'center',
      'text-margin-x': 0,
      'text-margin-y': 0,
    },
  },
  {
    selector: 'node[percentExpanded]',
    style: {
      'pie-size': '80%',
      'pie-1-background-color': '#01B4C5',
      'pie-1-background-size': 'data(percentExpanded)',
      'pie-1-background-opacity': 0,
    },
  },
  {
    selector: 'node.movie',
    style: {
      // label: 'data(title)',
      label: ele => `${
            !ele.data('poster_path') || ele.data('original_language') !== 'en'
            ? `${ele.data('title')}\n`
            : ''
          }${
            ele.data('release_date')
            ? `(${
              ele.data('release_date').split('-')[0]
            }) `
            : ''
          }${
            ele.data('vote_count') > 10
            ? `${
              Math.round(ele.data('vote_average') * 100 / 10)
            }% `
            : ''
          }${
            ele.data('runtime') ? `${ele.data('runtime')}m` : ''
          }`,
      'text-margin-y': 5,
      width: 45,
      height: 68,
      'z-index': 1,
      shape: 'round-rectangle',
      'background-image': ele => 'https://image.tmdb.org/t/p/w500' + ele.data('poster_path'),
    },
  },
  {
    selector: 'node.movie[!poster_path]',
    style: {
      'text-margin-y': 0,
      'text-valign': 'center',
      'background-fill': 'solid',
      'background-color': '#333',
      'background-image': null,
    },
  },
  {
    selector: 'node.person',
    style: {
      label: 'data(name)',
      width: 45,
      height: 45,
      'z-index': 2,
      shape: 'ellipse',
      'underlay-shape': 'ellipse',
      'background-image': ele => 'https://image.tmdb.org/t/p/w185' + ele.data('profile_path'),
      'background-offset-y': '-40%',
    },
  },
  {
    selector: 'node.person[!profile_path]',
    style: {
      'text-valign': 'center',
      'background-fill': 'solid',
      'background-color': '#333',
      'background-image': null,
    },
  },
  {
    selector: 'node.foreground',
    style: {
      'underlay-color': '#eee',
      'underlay-padding': '1px',
      'underlay-opacity': 1.0,
    },
  },
  {
    selector: 'node.background',
    style: {
      opacity: 0.9,
      'transition-property': 'opacity',
      'transition-duration': '2s',
    },
  },
  {
    selector: 'node.filtered',
    style: {
      opacity: 0.2,
      'underlay-opacity': 0,
    },
  },
  {
    selector: 'edge',
    style: {
      width: 2,
      'line-color': '#333',
      'curve-style': 'straight',
    },
  },
  // {
  //   selector: 'edge[billing]',
  //   style: {
  //     color: '#777',
  //     'font-family': 'Roboto Mono, monospace',
  //     'font-size': 10,
  //     'min-zoomed-font-size': 20,
  //     'target-text-offset': 20,
  //     'target-label': 'data(billing)',
  //   },
  // },
] as CytoscapeOptions['style'];
