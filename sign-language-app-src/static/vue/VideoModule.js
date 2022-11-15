import { store } from './store.js'


export default {
    data() {
      return {
        store,
      }
    },
    template: `
    <video width="560" id="signVid" controls>
        <source :src="('http://c1781468.ferozo.com/data/lsa64/') + ('00' + String(store.sign)).slice(-3) + '_' + (('00') + String(Math.floor(Math.random() * 10) + 1)).slice(-3) + ('_001.mp4')" type="video/mp4">
        Your browser does not support the video tag.
    </video>`
}
