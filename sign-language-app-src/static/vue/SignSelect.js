import { store } from './store.js'
import { signs } from '../signs.js'


export default {
    data() {
      return {
        store,
        signs: signs
    }
    },
    methods: {
        onChange(event) {
            document.getElementById("signVid").load()
            document.getElementById("signVid").play()
        }
    },
    template: `
    <select v-model="store.sign" class="form-select" @change="onChange($event)">
        <option disabled value="">Elige una seña</option>
        <option v-for="option in signs" :value="option.id">
            {{ option.name }}
        </option>
    </select>`
}
