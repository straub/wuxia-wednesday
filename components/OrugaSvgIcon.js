
import { h, computed } from 'vue'
import { mdiClose, mdiLoading } from '@mdi/js'

const knownIcons = { mdiClose, mdiLoading }

export default {
    props: {
        icon: Array,
        size: {
            type: [Number, String],
            default: 24
        },
    },
    setup (props) {
        console.log({ props })

        const path = computed(() => {
            const [, iconName] = props.icon
            
            // Convert kebab-case to camelCase
            const iconKey = iconName.replace(/-./g, y => y[1].toUpperCase());
            if (knownIcons[iconKey]) {
                return knownIcons[iconKey];
            }

            console.warn('unknown icon', iconKey)
        })

        const sizeNumber = computed(() => Number((props.size || 24).replace(/(mdi-|px)/g, '')))

        return () => {
            return h(
                'svg',
                {
                    class: 'icon',
                    width: sizeNumber.value,
                    height: sizeNumber.value,
                    viewBox: '0 0 24 24',
                    'aria-hidden': true,
                },
                [
                    h('path', { d: path.value, fill: 'currentColor' }),
                ]
            )
        }
    }
}
